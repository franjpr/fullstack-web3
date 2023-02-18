import { Address, Bytes, BigInt } from '@graphprotocol/graph-ts';
import {
  NFTBought as NFTBoughtEvent,
  NFTListed as NFTListedEvent,
  NFTUnlisted as NFTUnlistedEvent,
} from '../generated/DevMarketplace/DevMarketplace';
import { NFTBought, NFTListed, NFTUnlisted, ActiveNFTs } from '../generated/schema';

export function handleNFTBought(event: NFTBoughtEvent): void {
  let entity = NFTBought.load(buildId(event.params.tokenId, event.params.nftContractAddress));
  let active = ActiveNFTs.load(buildId(event.params.tokenId, event.params.nftContractAddress));

  if (!entity) {
    entity = new NFTBought(buildId(event.params.tokenId, event.params.nftContractAddress));
  }

  entity.buyerAddress = event.params.buyerAddress;
  entity.nftContractAddress = event.params.nftContractAddress;
  entity.tokenId = event.params.tokenId;
  entity.price = event.params.price;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  if (active) {
    active.buyer = event.params.buyerAddress;
    active.save();
  }

  entity.save();
}

export function handleNFTListed(event: NFTListedEvent): void {
  let entity = NFTListed.load(buildId(event.params.tokenId, event.params.nftContractAddress));
  let active = ActiveNFTs.load(buildId(event.params.tokenId, event.params.nftContractAddress));

  if (!entity) {
    entity = new NFTListed(buildId(event.params.tokenId, event.params.nftContractAddress));
  }

  if (!active) {
    active = new ActiveNFTs(buildId(event.params.tokenId, event.params.nftContractAddress));
  }

  entity.nftContractAddress = event.params.nftContractAddress;
  entity.tokenId = event.params.tokenId;
  entity.price = event.params.price;
  entity.seller = event.params.seller;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  active.nftContractAddress = event.params.nftContractAddress;
  active.tokenId = event.params.tokenId;
  active.price = event.params.price;
  active.seller = event.params.seller;
  active.blockNumber = event.block.number;
  active.blockTimestamp = event.block.timestamp;
  active.transactionHash = event.transaction.hash;
  active.buyer = Address.fromString('0x0000000000000000000000000000000000000000');

  entity.save();
  active.save();
}

export function handleNFTUnlisted(event: NFTUnlistedEvent): void {
  let entity = NFTUnlisted.load(buildId(event.params.tokenId, event.params.nftContractAddress));
  let active = ActiveNFTs.load(buildId(event.params.tokenId, event.params.nftContractAddress));

  if (!entity) {
    entity = new NFTUnlisted(buildId(event.params.tokenId, event.params.nftContractAddress));
  }

  entity.nftContractAddress = event.params.nftContractAddress;
  entity.tokenId = event.params.tokenId;
  entity.owner = event.params.owner;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  active!.buyer = Address.fromString('0x000000000000000000000000000000000000dead');

  entity.save();
  active!.save();
}

function buildId(tokenId: BigInt, address: Address): Bytes {
  return Bytes.fromHexString(`${tokenId.toHexString()}${address.toHexString()}`);
}
