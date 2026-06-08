const imageInput = document.getElementById('imageInput');
const submitButton = document.getElementById('submitButton');
const deployButton = document.getElementById('deployButton');
const diagnosticsButton = document.getElementById('diagnosticsButton');
const endpointInput = document.getElementById('endpointInput');
const endpointLabel = document.getElementById('endpointLabel');
const githubTokenInput = document.getElementById('githubTokenInput');
const statusMessage = document.getElementById('statusMessage');
const errorDetail = document.getElementById('errorDetail');
const resultOutput = document.getElementById('resultOutput');

const DEFAULT_JHUB_ENDPOINT = 'https://units.jhubafrica.com/submit';

const GH_OWNER = 'harryshirlif21';
const GH_REPO = 'COLLAB-MEETING-APP';
const GH_WORKFLOW_ID = 'main.yml';
const GH_REF = 'main';

const savedEndpoint = localStorage.getItem('medicalAiGatewayEndpoint') || DEFAULT_JHUB_ENDPOINT;
endpointInput.value = savedEndpoint;
endpointLabel.textContent = savedEndpoint;

const getGatewayEndpoint = () => endpointInput.value.trim() || DEFAULT_JHUB_ENDPOINT;

const getUrlForPath = (path) => {
    const endpoint = new URL(getGatewayEndpoint());
    return new URL(path, endpoint.origin).toString();
};

const clearError = () => {
    errorDetail.style.display = 'none';
    errorDetail.innerHTML = '';
};

const setStatus = (message, isError = false) => {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? '#b91c1c' : '#111827';
};

const setResult = (data) => {
    resultOutput.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
};

const formatJson = (data) => JSON.stringify(data, null, 2);

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const readResponseBody = async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (_) {
        return text;
    }
};

const showError = ({ title = 'Request failed', message, endpoint, method, status, responseBody, hint, error }) => {
    const diagnostic = {
        time: new Date().toISOString(),
        endpoint,
        method,
        status,
        message,
        responseBody,
        browserError: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
        } : undefined,
    };

    errorDetail.style.display = 'block';
    errorDetail.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        <div><strong>Message:</strong> ${escapeHtml(message || 'Unknown error')}</div>
        <div><strong>Endpoint:</strong> ${escapeHtml(endpoint || 'n/a')}</div>
        <div><strong>Method:</strong> ${escapeHtml(method || 'n/a')}</div>
        <div><strong>Status:</strong> ${escapeHtml(status || 'No HTTP response')}</div>
        ${hint ? `<div><strong>Hint:</strong> ${escapeHtml(hint)}</div>` : ''}
        <pre>${escapeHtml(formatJson(diagnostic))}</pre>
    `;
};

const checkGatewayHealth = async () => {
    const endpoint = getUrlForPath('/health');
    const response = await fetch(endpoint);
    const body = await readResponseBody(response);

    if (!response.ok) {
        const error = new Error(`Health check failed: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.responseBody = body;
        throw error;
    }

    return body;
};

const checkServices = async () => {
    const endpoint = getUrlForPath('/services');
    const response = await fetch(endpoint);
    const body = await readResponseBody(response);

    if (!response.ok) {
        const error = new Error(`Services check failed: ${response.status} ${response.statusText}`);
        error.status = response.status;
        error.responseBody = body;
        throw error;
    }

    return body;
};

const runDiagnostics = async () => {
    clearError();
    setStatus('Running gateway diagnostics...');
    setResult('');

    const diagnostics = {
        time: new Date().toISOString(),
        submitEndpoint: getGatewayEndpoint(),
        healthEndpoint: getUrlForPath('/health'),
        servicesEndpoint: getUrlForPath('/services'),
        health: null,
        services: null,
    };

    try {
        diagnostics.health = { ok: true, body: await checkGatewayHealth() };
    } catch (error) {
        diagnostics.health = { ok: false, message: error.message, status: error.status, body: error.responseBody };
    }

    try {
        diagnostics.services = { ok: true, body: await checkServices() };
    } catch (error) {
        diagnostics.services = { ok: false, message: error.message, status: error.status, body: error.responseBody };
    }

    setResult(diagnostics);

    if (!diagnostics.health.ok) {
        setStatus('Gateway diagnostics found an issue.', true);
        showError({
            title: 'Gateway health check failed',
            message: diagnostics.health.message,
            endpoint: diagnostics.healthEndpoint,
            method: 'GET',
            status: diagnostics.health.status,
            responseBody: diagnostics.health.body,
            hint: 'Confirm the JHub server is running the gateway and that the public route exposes /health.',
        });
        return;
    }

    setStatus('Gateway is reachable. Diagnostics are shown below.');
};

endpointInput.addEventListener('change', () => {
    const endpoint = getGatewayEndpoint();
    localStorage.setItem('medicalAiGatewayEndpoint', endpoint);
    endpointLabel.textContent = endpoint;
});

submitButton.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) {
        setStatus('Please select an image first.', true);
        return;
    }

    clearError();
    const endpoint = getGatewayEndpoint();
    localStorage.setItem('medicalAiGatewayEndpoint', endpoint);
    endpointLabel.textContent = endpoint;

    setStatus('Uploading image to JHub and running the model...');
    submitButton.disabled = true;
    setResult('');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });
        const data = await readResponseBody(response);

        if (!response.ok) {
            showError({
                title: 'Model request failed',
                message: `Request failed: ${response.status} ${response.statusText}`,
                endpoint,
                method: 'POST',
                status: `${response.status} ${response.statusText}`,
                responseBody: data,
                hint: response.status === 404
                    ? 'The gateway is reachable, but this route was not found. Check whether JHub exposes /submit, /api/v1/submit, or another base path.'
                    : 'Check the response payload and gateway logs for the upstream service error.',
            });
            setStatus('Failed to run model.', true);
            setResult({ error: `Request failed: ${response.status} ${response.statusText}`, details: data });
            return;
        }

        setStatus('Model run completed successfully.');
        setResult(data);
    } catch (err) {
        setStatus('Failed to run model.', true);
        showError({
            title: 'Network or browser request failed',
            message: err.message,
            endpoint,
            method: 'POST',
            hint: 'If the server is online, check CORS, HTTPS certificates, DNS, and whether the JHub route is publicly reachable from this browser.',
            error: err,
        });
        setResult({ error: err.message, timestamp: new Date().toISOString() });
    } finally {
        submitButton.disabled = false;
    }
});

diagnosticsButton.addEventListener('click', runDiagnostics);

deployButton.addEventListener('click', async () => {
    const token = githubTokenInput.value.trim();
    if (!token) {
        setStatus('Enter a GitHub token with Actions: write permission first.', true);
        showError({
            title: 'GitHub token required',
            message: 'A browser cannot trigger workflow_dispatch without an authenticated GitHub API request.',
            endpoint: `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW_ID}/dispatches`,
            method: 'POST',
            hint: 'Use a fine-grained token scoped to this repository with Actions: write. The token stays in this browser request and is not saved.',
        });
        return;
    }

    if (!confirm('This will trigger GitHub Actions to build the Medical AI images and push them to Docker Hub. Continue?')) return;

    clearError();
    setStatus('Triggering Medical AI Docker Hub workflow...');
    deployButton.disabled = true;
    setResult('');

    const endpoint = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${GH_WORKFLOW_ID}/dispatches`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28',
            },
            body: JSON.stringify({
                ref: GH_REF,
                inputs: {
                    load_medical_model: 'true',
                },
            }),
        });

        if (response.status === 204) {
            setStatus('Workflow triggered. Check GitHub Actions for the Docker Hub build.');
            setResult({
                workflow: GH_WORKFLOW_ID,
                ref: GH_REF,
                repository: `${GH_OWNER}/${GH_REPO}`,
                action: 'build-and-push-medical-model-images',
            });
        } else {
            const body = await readResponseBody(response);
            showError({
                title: 'GitHub workflow dispatch failed',
                message: `GitHub API returned ${response.status} ${response.statusText}`,
                endpoint,
                method: 'POST',
                status: `${response.status} ${response.statusText}`,
                responseBody: body,
                hint: 'Confirm the token has Actions: write permission and the workflow has workflow_dispatch enabled on the selected ref.',
            });
            setStatus('Failed to trigger Docker Hub workflow.', true);
            setResult({ error: `GitHub API returned ${response.status}`, details: body });
        }
    } catch (err) {
        setStatus('Failed to trigger Docker Hub workflow.', true);
        showError({
            title: 'GitHub workflow dispatch request failed',
            message: err.message,
            endpoint,
            method: 'POST',
            hint: 'Check connectivity to api.github.com and browser CORS/network restrictions.',
            error: err,
        });
    } finally {
        deployButton.disabled = false;
    }
});
