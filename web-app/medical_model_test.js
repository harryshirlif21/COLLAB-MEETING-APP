const imageInput = document.getElementById('imageInput');
const submitButton = document.getElementById('submitButton');
const statusMessage = document.getElementById('statusMessage');
const resultOutput = document.getElementById('resultOutput');

const gatewayUrl = 'http://localhost:8000/submit';

function setStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.style.color = isError ? '#b91c1c' : '#111827';
}

function setResult(result) {
  resultOutput.textContent = JSON.stringify(result, null, 2);
}

submitButton.addEventListener('click', async () => {
  const file = imageInput.files[0];

  if (!file) {
    setStatus('Please select an image file first.', true);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  submitButton.disabled = true;
  setStatus('Uploading image and running model...');
  setResult('');

  try {
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    setStatus('Model run completed successfully. See results below.');
    setResult(result);
  } catch (error) {
    setStatus(`Error: ${error.message}`, true);
    setResult({ error: error.message });
  } finally {
    submitButton.disabled = false;
  }
});
