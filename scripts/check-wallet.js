const { privateKeyToAccount } = require("@arkiv-network/sdk/accounts")
const fs = require("fs")
const path = require("path")

let pk = process.env.PRIVATE_KEY

if (!pk) {
  try {
    const envPath = path.join(__dirname, "..", ".env.local")
    const envContent = fs.readFileSync(envPath, "utf8")
    const match = envContent.match(/^PRIVATE_KEY=(.+)$/m)
    if (match) pk = match[1].trim()
  } catch {}
}

if (!pk) {
  console.error("Error: PRIVATE_KEY no definida")
  console.error("Generá una con: node scripts/generate-wallet.js")
  process.exit(1)
}

const account = privateKeyToAccount(pk)
console.log("=== AeroTrack Sentinel — Wallet ===")
console.log("")
console.log("Dirección pública (pegá en el faucet):")
console.log(account.address)
console.log("")
console.log("Faucet: https://braga.hoodi.arkiv.network/faucet/")
console.log("Network: Braga Testnet (ID: 60138453102)")