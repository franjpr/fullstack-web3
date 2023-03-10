import styles from '@/styles/Home.module.css';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { useQuery } from '@apollo/client';
import { GET_ACTIVE_NFTS } from '@/gqlqueries/activeNfts.query';
import NFTBox, { GraphQLNft } from '@/components/NFTBox/NFTBox';
import DevMarketplaceAbi from '../../abis/DevMarketplace.json';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNotification } from '@web3uikit/core';

const marketplaceContract = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT ?? '';

export default function Home() {
	const { isWeb3Enabled, account } = useMoralis();
	const { loading, data: activeNfts } = useQuery(GET_ACTIVE_NFTS);
	const [benefits, setBenefits] = useState('0');
	const displayNotification = useNotification();
	const { runContractFunction: getBenefits } = useWeb3Contract({
		abi: DevMarketplaceAbi,
		contractAddress: marketplaceContract,
		functionName: 'getBenefits',
		params: {
			seller: account,
		},
	});

	const { runContractFunction: withdraw } = useWeb3Contract({
		abi: DevMarketplaceAbi,
		contractAddress: marketplaceContract,
		functionName: 'withdraw',
	});

	function handleWithdraw() {
		withdraw({
			onSuccess: (txReceipt: any) => {
				displayNotification({
					position: 'topR',
					type: 'success',
					title: 'Withdraw',
					message: `Tx: ${txReceipt.hash}`,
				});
			},
			onError: (txReceipt: any) => {
				console.warn('failed to widht', txReceipt);
				displayNotification({
					position: 'topR',
					type: 'error',
					title: 'Withdraw',
					message: `Tx: ${txReceipt.hash}`,
				});
			},
		});
	}

	useEffect(() => {
		if (account) {
			getBenefits().then((benefits) => {
				if (benefits) {
					setBenefits(ethers.formatUnits(`${benefits}`));
				}
			});
		}
	}, [account]);

	return (
		<main className={styles.main}>
			<h1>Marketplace</h1>
			<article>These are the active nfts</article>
			{isWeb3Enabled && (
				<div>
					<div>
						<h3>Benefits: {benefits} ETH</h3>
						<button onClick={handleWithdraw}>Withdraw</button>
					</div>
					{loading ? (
						<span>Fetching...</span>
					) : (
						<ul className={styles.nfts}>
							{activeNfts ? activeNfts.nftactives.map((nft: GraphQLNft) => <NFTBox key={nft.id} nft={nft} metadata={{}} />) : <>There are no listed items</>}
						</ul>
					)}
				</div>
			)}
		</main>
	);
}
