const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("Deploying PriceQuote contract to BOT Chain...");
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Network Name:     ${network.name}`);
  console.log(`Chain ID:         ${network.chainId.toString()}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} BOT`);
  console.log("==================================================");

  const PriceQuote = await hre.ethers.getContractFactory("PriceQuote");
  const priceQuote = await PriceQuote.deploy();
  await priceQuote.waitForDeployment();

  const contractAddress = await priceQuote.getAddress();
  console.log(`>>> PriceQuote deployed successfully to: ${contractAddress}`);

  // Extract ABI from artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PriceQuote.sol/PriceQuote.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const deploymentData = {
    contractAddress: contractAddress,
    address: contractAddress,
    defaultChainId: Number(network.chainId) || 968,
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    networks: {
      968: {
        name: 'BOT Chain Testnet',
        chainId: 968,
        chainIdHex: '0x3c8',
        rpcUrl: 'https://rpc.bohr.life',
        symbol: 'BOT',
        decimals: 18,
        blockExplorer: 'https://scan.bohr.life',
        faucetUrl: 'https://faucet.botchain.ai',
        isTestnet: true,
      },
      677: {
        name: 'BOT Chain Mainnet',
        chainId: 677,
        chainIdHex: '0x2a5',
        rpcUrl: 'https://rpc.botchain.ai',
        symbol: 'BOT',
        decimals: 18,
        blockExplorer: 'https://scan.botchain.ai',
        isTestnet: false,
      },
    },
    abi: abi,
  };

  // Save in project root
  fs.writeFileSync(
    path.join(__dirname, "../deployed-contract.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Saved deployment configuration to deployed-contract.json");

  // Save to frontend/src/contracts/contractConfig.json
  const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(frontendContractsDir, "contractConfig.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log("Synced configuration to frontend/src/contracts/contractConfig.json");

  // Update frontend/.env with deployed address
  const frontendEnvPath = path.join(__dirname, "../frontend/.env");
  if (fs.existsSync(frontendEnvPath)) {
    let envContent = fs.readFileSync(frontendEnvPath, "utf8");
    envContent = envContent.replace(/VITE_CONTRACT_ADDRESS=.*/g, `VITE_CONTRACT_ADDRESS="${contractAddress}"`);
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("Updated VITE_CONTRACT_ADDRESS in frontend/.env");
  }

  console.log("==================================================");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
