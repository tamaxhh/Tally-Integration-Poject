$xml = Get-Content "test-xml.xml"
$headers = @{
    "Content-Type" = "text/xml"
}
$response = Invoke-RestMethod -Uri "http://host.docker.internal:9000" -Method POST -Headers $headers -Body $xml -TimeoutSec 30
Write-Host "Tally Response:" $response
