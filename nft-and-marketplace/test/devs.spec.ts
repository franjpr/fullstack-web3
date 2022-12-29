import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployments, ethers, network } from "hardhat";
import {
  isDevelopmentChain,
  networkConfigHelper,
} from "../helper-hardhat.config";
import { Dev } from "../typechain-types";
import { HARDHAT_CHAINID } from "../utils/constants";

if (isDevelopmentChain(network.config.chainId ?? HARDHAT_CHAINID)) {
  describe("Devs NFTs", () => {
    let devNftContract: Dev;
    let accounts: Array<SignerWithAddress>;

    before(async () => {
      accounts = await getBlockchainsActiveAccounts();
    });

    beforeEach(async () => {
      // Run deployments by tag
      await deployments.fixture("nft");
      // Find deployed contracts by name
      const devNftDeployment = await deployments.get("Dev");
      // Get contract instance by name & deployment address
      devNftContract = await ethers.getContractAt(
        "Dev",
        devNftDeployment.address
      );
    });

    it("initializes with correct name and symbol", async () => {
      expect(await devNftContract.name()).to.eq("Developer");
      expect(await devNftContract.symbol()).to.eq("DEV");
    });

    it("sets a price for minting", async () => {
      const definedMintPrice = networkConfigHelper[HARDHAT_CHAINID].mintPrice;
      const mintFee = await devNftContract.getMintFee();

      expect(mintFee.toString()).to.eq(definedMintPrice.toString());
    });

    it("are limited only to 10", async () => {
      const getMaxSuppply = await devNftContract.getMaxSuppply();
      expect(getMaxSuppply.toString()).to.eq("10");
    });

    it("allow users to mint", async () => {
      await expect(devNftContract.mint()).to.emit(devNftContract, "Transfer");
      const numberOfMintedTokens = await devNftContract.getTokenCounter();
      expect(numberOfMintedTokens.toString()).to.eq("1");
    });

    it("reverts the tx when all the tokens are minted", async () => {
      // mint 10 times
      const mintingPromises = Array.from({ length: 10 }).map((_) =>
        devNftContract.mint()
      );

      await Promise.all(mintingPromises);

      await expect(devNftContract.mint()).to.revertedWithCustomError(
        devNftContract,
        "Dev__AllTokensMinted"
      );
    });

    it("stores the minter address of the tokenId", async () => {
      await devNftContract.mint();
      // connect and mint with another account
      devNftContract = devNftContract.connect(accounts[1]);
      await devNftContract.mint();

      const firstTokenMited = await devNftContract.getTokenByMinterAddress(
        accounts[0].address
      );
      const secondTokenMinted = await devNftContract.getTokenByMinterAddress(
        accounts[1].address
      );
      const totalMinted = await devNftContract.getTokenCounter();

      expect(firstTokenMited.toString()).to.eq("0");
      expect(await devNftContract.ownerOf("0")).to.eq(accounts[0].address);
      expect(secondTokenMinted.toString()).to.eq("1");
      expect(await devNftContract.ownerOf("1")).to.eq(accounts[1].address);
      expect(totalMinted.toString()).to.eq("2");
    });
  });

  const getBlockchainsActiveAccounts = async (): Promise<
    Array<SignerWithAddress>
  > => {
    return await ethers.getSigners();
  };
}