# ChatGPT @ HKUST<br/>CORS Worker

This is a reverse proxy cloud function (Cloudflare Worker) that bypasses CORS restrictions for the HKUST Azure OpenAI
API.

## Usage

Access the endpoint just like the original API with the hostname replaced.

For example, if the original API is
```
https://hkust.azure-api.net/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-07-01-preview
```
then the endpoint for the reverse proxy will be
```
https://<CLOUD_FUNCTION_HOSTNAME>/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-07-01-preview
```
