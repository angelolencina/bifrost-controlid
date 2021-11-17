#!/bin/bash
curl -v --location --request POST 'http://127.0.0.1:3000/events' \
--header 'x-hub-signature: 4a455b15c182e6cf5b4cbb0c9bf49ec66002a9e8ef6ea0edce1ad9b4cb4f5531' \
--header 'Content-Type: application/json' \
--data-raw '{"subscription_id":"edbb6c57-167e-46c9-9115-d8f7dec7bd6a","transaction_id":"2473c158-668c-4731-9370-68ee82da36ee","send_at":"2021-11-16T13:49:48-03:00","event":"booking","resource":{"action":"created","route":"\/bookings\/3f7a6c88-efe8-4e53-ae0a-304d5939eeb3","uuid":"3f7a6c88-efe8-4e53-ae0a-304d5939eeb3"}}'
