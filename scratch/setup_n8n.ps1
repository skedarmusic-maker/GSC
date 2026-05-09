$N8N_URL = "https://n8n.srv1656304.hstgr.cloud"
$N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiM2ZkNmIzNS0yM2MxLTQxMGUtODkwOC01MWQ0MmNjN2Q3OWIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNGQxZGRiMTMtMjBkMS00Mzg0LWFiYmUtZDYxZDZkYTQ1MGI2IiwiaWF0IjoxNzc4MzAxMjc3LCJleHAiOjE3ODYwNTM2MDB9.Cs44H5HODa5_5ph8YXTtEfuGICt0Eup632gRiQ4PWoQ"

$headers = @{
    "X-N8N-API-KEY" = $N8N_API_KEY
    "Content-Type"  = "application/json"
}

# 1. Listar workflows para achar o ID certo
Write-Host "Buscando workflows existentes..."
$list = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows" -Method Get -Headers $headers
$list.data | ForEach-Object { Write-Host "ID: $($_.id) | Nome: $($_.name)" }

# 2. Pegar o ID do workflow criado (o mais recente)
$targetId = ($list.data | Sort-Object { $_.updatedAt } -Descending | Select-Object -First 1).id
Write-Host "`nAtualizando workflow ID: $targetId"

# 3. Payload correto com os nos dentro do workflow
$payload = @{
    name = "Weekly GSC SEO Scan"
    nodes = @(
        @{
            id           = "node-schedule-001"
            name         = "Schedule Trigger"
            type         = "n8n-nodes-base.scheduleTrigger"
            typeVersion  = 1.1
            position     = @(240, 300)
            parameters   = @{
                rule = @{
                    interval = @(
                        @{
                            field              = "weeks"
                            triggerAtHour      = 8
                            triggerAtMinute    = 0
                            triggerAtDayOfWeek = @(1)
                        }
                    )
                }
            }
        },
        @{
            id          = "node-http-001"
            name        = "Scan GSC via Dashboard"
            type        = "n8n-nodes-base.httpRequest"
            typeVersion = 4.1
            position    = @(460, 300)
            parameters  = @{
                method      = "POST"
                url         = "https://gsc-delta-eight.vercel.app/api/n8n/scan-gsc"
                sendHeaders = $true
                headerParameters = @{
                    parameters = @(
                        @{
                            name  = "x-api-key"
                            value = "focus_arts_secure_automation_key_2024"
                        }
                    )
                }
                sendBody    = $true
                specifyBody = "json"
                jsonBody    = '{"clientId": null}'
                options     = @{}
            }
        }
    )
    connections = @{
        "Schedule Trigger" = @{
            main = @(
                @(
                    @{
                        node  = "Scan GSC via Dashboard"
                        type  = "main"
                        index = 0
                    }
                )
            )
        }
    }
    settings = @{
        executionOrder = "v1"
    }
}

$json = $payload | ConvertTo-Json -Depth 20

try {
    $response = Invoke-RestMethod -Uri "$N8N_URL/api/v1/workflows/$targetId" -Method Put -Headers $headers -Body $json
    Write-Host "`n Workflow atualizado com sucesso!"
    Write-Host "Nome: $($response.name)"
    Write-Host "Nodes: $($response.nodes.Count)"
} catch {
    Write-Host "Erro ao atualizar: $_"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $reader.ReadToEnd()
}
