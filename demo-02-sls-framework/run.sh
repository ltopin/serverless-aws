#instalar o serverless
npm i -g serverless

#inicializar
sls

#sempre fazer o deploy antes de tudo para verificar se o ambiente esta OK

sls deploy

#invocar na AWS

sls invoke -f hello

#invocar local

sls invoke local -f hello --log

#configurar dashboard

sls

#logs 

sls logs -f hello -t

#remover 
sls remove