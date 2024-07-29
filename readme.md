# OSAIL-LIASO
OSAIL-LAISO is the 'Open Source AI Laboratory' (or in French, 'Laboratoire d'IA à source ouverte'), a collaborative online platform for building tools and technologies for integrating with Large Language Models and Generative AI.

## About
OSAIL is built in 2 parts, a Vue.js web interface and a Node.js server side application (this package).

## Configuration
The application also requires environment variables to operate

Place the following information into your .env file in the root of your project.
### App Configuration
NODE_ENV=DEV #or PROD
PORT=3000 #localhost testing port, overwritten on deployment
LOG_LEVEL=info #or debug, info, or #verbose
TIMEOUT=30000 #query timeout for long open connections
JWT_SECRET=#randomly generated hard to guess string for signing tokens

### Database Connection
- PRIMARYDB=sequelize # mongoDb or sequelize - this determines who gets to do the read functions, while writes, updates, deletes are synchronized
- MONGODB= #Connection string to a MongoDB or an Atlas MongoDB, if applicable
- SQL_SERVER= #server URL
- SQL_DATABASE= #database name
- SQL_USER= #username
- SQL_PASSWORD= #password
- SQL_ENCRYPT=true
- SQL_TRUST_SERVER_CERTIFICATE=true

### API Keys
- OPENAI_API_KEY= #The provided Key from the service
- ANTHROPIC_API_KEY= #The provided Key from the service
- AZURE_OPENAI_KEY= #The provided Key from the service
- AZURE_OPENAI_ENDPOINT= #The provided Key from the service
- MISTRAL_API_KEY= #The provided Key from the service
- GROQ_API_KEY= #The provided Key from the service

### Tools
DEEPGRAM_API_KEY= #An API key for converting audio to text

### User Settings
- CHARACTERS_RESERVE_DEFAULT=1000000 #number of characters to grant to a user, if applicablke

# Application Server License
The MIT License (MIT)

Copyright (c) 2023-current OSAIL-LIASO.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

