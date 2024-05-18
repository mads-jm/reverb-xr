
document.addEventListener('DOMContentLoaded', () => {
  const audioProcessor = new AudioProcessor();

  document.getElementById('start-mic').addEventListener('click', () => {
    audioProcessor.initMicrophone();
  });

  document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      audioProcessor.initFile(file);
    }
  });

  // A-Frame visualization

  const dataArray = audioProcessor.getTimeDomainData();

});