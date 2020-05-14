


++++++++++++++++++++++++++++++++
Extract crt and key from pfx
++++++++++++++++++++++++++++++++
openssl pkcs12 -in uat-protocolbuster-com-201819.pfx -clcerts -nokeys -out certificate.crt
openssl pkcs12 -in uat-protocolbuster-com-201819.pfx -nocerts -nodes  -out privatekey.key