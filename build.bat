@echo off
SETLOCAL EnableDelayedExpansion

REM Reverb XR Webpack Build & Run Script
REM -----------------------------------

REM Check if Node.js is installed
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [31mError: Node.js is not installed or not in your PATH.[0m
    echo Please install Node.js from https://nodejs.org/ and try again.
    exit /b 1
)

REM Check if npm is installed
WHERE npm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [31mError: npm is not installed or not in your PATH.[0m
    echo Please ensure npm is installed with Node.js and try again.
    exit /b 1
)

REM Check if npx is available
WHERE npx >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [31mWarning: npx is not found in your PATH.[0m
    echo This script requires npx, which comes with npm 5.2.0 and higher.
    echo You may need to update your npm version with 'npm install -g npm'.
    exit /b 1
)

REM Check dependencies
echo Checking dependencies...
SET MISSING_DEPS=0
SET PACKAGES_TO_INSTALL=

REM Function to check dependencies
FOR %%D IN (webpack webpack-cli webpack-dev-server) DO (
    call npm list %%D --depth=0 >nul 2>nul
    IF !ERRORLEVEL! NEQ 0 (
        echo [33mWarning: %%D is not installed.[0m
        SET /A MISSING_DEPS+=1
        SET PACKAGES_TO_INSTALL=!PACKAGES_TO_INSTALL! %%D
    )
)

REM Check if chalk is installed separately (used for colored output but not essential)
SET CHALK_MISSING=0
call npm list chalk --depth=0 >nul 2>nul
IF !ERRORLEVEL! NEQ 0 (
    SET CHALK_MISSING=1
)

IF !MISSING_DEPS! GTR 0 (
    echo [33mSome required packages are missing:!PACKAGES_TO_INSTALL![0m
    echo Would you like to install them? (Y/N)
    SET /P INSTALL_DEPS=
    IF /I "!INSTALL_DEPS!"=="Y" (
        echo Installing dependencies...
        call npm install !PACKAGES_TO_INSTALL! --save-dev
        IF !ERRORLEVEL! NEQ 0 (
            echo [31mFailed to install dependencies. Please run 'npm install' manually.[0m
            exit /b 1
        )
        echo [32mDependencies installed successfully.[0m
    ) ELSE (
        echo [31mCannot proceed without required dependencies. Please install them manually.[0m
        exit /b 1
    )
)

REM Check for chalk separately (it's optional but recommended)
IF !CHALK_MISSING! EQU 1 (
    echo [33mChalk is not installed. This is used for better console output.[0m
    echo Would you like to install chalk? (Y/N)
    SET /P INSTALL_CHALK=
    IF /I "!INSTALL_CHALK!"=="Y" (
        echo Installing chalk...
        call npm install chalk --save-dev
        IF !ERRORLEVEL! NEQ 0 (
            echo [31mFailed to install chalk, but will continue without it.[0m
        ) ELSE (
            echo [32mChalk installed successfully.[0m
        )
    ) ELSE (
        echo Continuing without chalk...
    )
)

REM Process command line arguments
SET COMMAND=%1
IF "%COMMAND%"=="" (
    call :SHOW_HELP
    exit /b 0
)

IF /I "%COMMAND%"=="dev" (
    echo [36mBuilding for development...[0m
    node webpack-scripts.js dev
    goto :END
)

IF /I "%COMMAND%"=="prod" (
    echo [36mBuilding for production...[0m
    node webpack-scripts.js prod
    goto :END
)

IF /I "%COMMAND%"=="serve" (
    echo [36mStarting development server...[0m
    node webpack-scripts.js serve
    goto :END
)

IF /I "%COMMAND%"=="start" (
    echo [36mBuilding and starting development server...[0m
    node webpack-scripts.js start
    goto :END
)

IF /I "%COMMAND%"=="help" (
    call :SHOW_HELP
    goto :END
) ELSE (
    echo [31mUnknown command: %COMMAND%[0m
    call :SHOW_HELP
    exit /b 1
)

:END
exit /b 0

REM Show help function
:SHOW_HELP
echo.
echo [36mReverb XR Webpack Build Script[0m
echo.
echo [33mUsage:[0m
echo   build.bat [command]
echo.
echo [33mCommands:[0m
echo   [32mdev[0m    - Build for development
echo   [32mprod[0m   - Build for production
echo   [32mserve[0m  - Start development server
echo   [32mstart[0m  - Build for development and start server
echo   [32mhelp[0m   - Show this help message
echo.
echo [33mExamples:[0m
echo   [36mbuild.bat dev[0m    - Build project for development
echo   [36mbuild.bat prod[0m   - Build project for production
echo   [36mbuild.bat serve[0m  - Start webpack-dev-server
echo   [36mbuild.bat start[0m  - Build and start server
goto :EOF 