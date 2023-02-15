ForwardRule
-----------

A criação de regras de encaminhamento requer informações da VPC, do Load Balancer e do Listener. Esse componente abstrai a busca dessas informações bem como já assume alguns comportamentos padrões, como a configuração do health check e a utilização do listener HTTPS.

Esse componente também cria um Target Group de maneira transparente.
