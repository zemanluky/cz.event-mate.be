# EventMate BE

Monorepozitář pro mikroservisní služby, které tvoří BE aplikace EventMate.

- [Struktura projektu](#project-structure)
- [Prerekvizity](#preparation)
- [Spuštění projektu](#project-configuration)
  - [1. Konfigurace JWT](#project-configuration_jwt-keys)
  - [2. Lokální .env secrets](#project-configuration_local-environment)
  - [3. Konfigurace SSL](#project-configuration_ssl)
  - [4. Build](#project-configuration_build)

<a name="project-structure"></a>
## Struktura projektu

Zde si můžete projít hrubou strukturu projektu, aby bylo jasné kde co hledat. Jsou vytažené nejdůležitější složky a 
logické celky.

````Shell
cz.pilsco.skynet
├─📂 credentials # Contains secrets, keys needed to run the apps
├─📂 docker # related docker configuration files, such as Dockerfiles and nginx site/server conf
├─📂 src # contains code of all microservices
│    ├─📂 [microservice] 
│          ├─📂 controller # all controllers for the given microservice are defined here
│          ├─📂 error # application errors which are automatically transformed to json responses
│          ├─📂 helper # helper functions and types
│               ├─📃 error.handler.ts # Global error handler for express. Automatically transforms exception from any handler.
│               ├─📃 jwt.service.ts # Functions for signing and verifying JWT tokens.
│               ├─📃 microservice.url.ts # Function for creating URL to other microservice's endpoints
│               ├─📃 mongo.connector.ts # Function for connecting to the MongoDB database via mongoose pkg
│               ├─📃 request.validator.ts # Functions for validating and transforming request body, parameters or query parameters.
│               └─📃 response.helper.ts # Functions for sending structured responses.
│          ├─📂 schema # definitions for database and request object schemas
│          └─📂 service # business layer functions
│    ├─ more microservices ...
└─📃 docker-compose.yml # Docker configuration for this project
````

<a name="preparation"></a>
## Prerekvizity

Před spuštěním a prácí s projektem je potřeba mít lokálně nainstalované následující tools:

- Package manager, bundler - [Bun](https://bun.sh/docs)
- Kontejnerizace - [Docker + docker compose](https://www.docker.com/)
- Vytváření lokálních SSL certifikátů - [mkcert](https://github.com/FiloSottile/mkcert?tab=readme-ov-file#macos)

V případě, že používáš Windows, ideálně si nakonfiguruj WSL2. Případně piš projekťákovi. :) 


<a name="project-configuration"></a>
## Příprava spuštění projektu

Na projektu je připravena Docker Compose konfigurace pro jednoduché spuštění všech potřebných součástí. 
Nicméně před samotným spuštěním je potřeba nakopírovat environment secrets a vygenerovat některé klíče.

<a name="project-configuration_jwt-keys"></a>
### 1. Vygenerování klíčů pro JWT

Pro správnou funkci autorizace uživatelů je potřeba vygenerovat jwt klíče. Přesuň se do složky ``/credentials/jwt``,
kde následně vygeneruj klíče pomocí OpenSSL.

````Shell
# generate private key
openssl genrsa -out private-key.pem 2048

# generate public key from the private one
openssl rsa -in private-key.pem -pubout > public-key.pem
````

<a name="project-configuration_local-environment"></a>
### 2. Environment secrets

Zatím nejsou žádné specifické environment variables, které by bylo třeba vkládat. Nicméně, z důvodu bezpečnosti se nikdy
env soubory necommitují do repozitáře. Proto si prosím pouze nakopíruj example. Na to stačí pouze následující 
příkaz.

````Shell
cp .env.example .env
````


<a name="project-configuration_ssl"></a>
### 3. Konfigurace lokálního SSL

Pro ideální funkcionalitu při testování v prohlížeči je dobré nakonfigurovat SSL. Pro tohle výborně poslouží utility 
``mkcert``, která je dostupná na všech operačních systémech.

Podle tvého OS si utility [nainstaluj podle pokynů](https://github.com/FiloSottile/mkcert), a následně si 
nainstaluj do svého zařízení touto utilitou certifikát.

> [!TIP]
> Pokud jsi na Windows a používáš WSL jako svoje vývojové prostředí, instalace a prvotní konfigurace
> je o pár kroků složitější. Skvěle však proces konfigurace popisuje 
> [tento článek](https://saranga.dev/setting-up-self-signed-ssl-certificates-for-local-development-in-wsl2-2cfb121714be).

````shell
# you need to do this only once - if you already did this step, you can skip this
mkcert -install
````

Poslední, co by tedy mělo být potřeba, je samotný SSL klíč a certifikát vygenerovat. Přesuň se v rámci projektu do 
složky ``docker/nginx/ssl/`` a zde použij následující příkaz, který by měl vše potřebné vytvořit za tebe:

````shell
mkcert -cert-file server.crt -key-file server.key 127.0.0.1
````

Po vytvoření nového klíče/certifikátu je vždy nutný rebuild nginx containeru.

<a name="project-configuration_build"></a>
### 4. Build

Pro rozjetí projektu lokálně pak pouze stačí v rootu projektu použit následující příkaz.

````shell
docker compose up
# if you need to rebuild
docker compose build 
````

Nyní bys měl mít lokálně projekt zprovozněný včetně SSL. Připojit se můžeš normálně přes 
[https://127.0.0.1/](https://127.0.0.1/). S tím, že mikroslužby běží na sub lokacích. Tedy například auth mikroslužba 
běží na https://127.0.0.1/auth, nebo event na https://127.0.0.1/event.

