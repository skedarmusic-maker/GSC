$N8N_URL = "https://n8n.srv1656304.hstgr.cloud"
$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiM2ZkNmIzNS0yM2MxLTQxMGUtODkwOC01MWQ0MmNjN2Q3OWIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNGQxZGRiMTMtMjBkMS00Mzg0LWFiYmUtZDYxZDZkYTQ1MGI2IiwiaWF0IjoxNzc4MzAxMjc3LCJleHAiOjE3ODYwNTM2MDB9.Cs44H5HODa5_5ph8YXTtEfuGICt0Eup632gRiQ4PWoQ"
$WORKFLOW_ID = "VQQfJjrUbMuq39qu"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

Write-Host "Inspecionando workflow $WORKFLOW_ID..."
$current = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$WORKFLOW_ID" -Method Get -Headers $headers
Write-Host "Nodes salvos: $($current.nodes.Count)"
Write-Host ($current.nodes | ConvertTo-Json -Depth 5)
