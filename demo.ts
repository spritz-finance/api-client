import { Environment, SpritzApiClient } from './dist/spritz-api-client'
import 'dotenv/config'

const INTEGRATOR_KEY = process.env.INTEGRATOR_KEY

async function run() {
    const client = SpritzApiClient.initialize({
        environment: Environment.Staging,
        integrationKey: INTEGRATOR_KEY,
    })
    // do something with the client
}
run()
