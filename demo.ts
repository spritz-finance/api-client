import 'dotenv/config'
import { Environment, SpritzApiClient } from './dist/spritz-api-client'

const INTEGRATOR_KEY = process.env.INTEGRATOR_KEY
const USER_KEY = process.env.USER_KEY

async function run() {
    const client = SpritzApiClient.initialize({
        environment: Environment.Staging,
        integrationKey: INTEGRATOR_KEY,
        apiKey: USER_KEY,
    })
    const me = await client.user.getCurrentUser()
    console.log({ me })
}
run()
