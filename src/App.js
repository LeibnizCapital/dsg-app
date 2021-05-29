import './assets/css/App.css';
import * as React from "react";
import {BigNumber, ethers} from "ethers";
import SubmissionList from "./components/SubmissionList";
import {Map} from "immutable";
import {
    Button,
    ChakraProvider,
    extendTheme,
    Heading,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay
} from "@chakra-ui/react"
// this is for tindercard
// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
    brand: {
        900: "#1a365d",
        800: "#153e75",
        700: "#2a69ac",
    },
}
const theme = extendTheme({colors});

const HOST = "http://dsg.network/api/v1";
const DAO_URL = `${HOST}/dao`;
const SUBMISSIONS_URL = `${HOST}/submissions`;

const abi = [
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "avatar",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "submissionHash",
                "type": "bytes32"
            }
        ],
        "name": "supportSubmission",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "avatar",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "submissionHash",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "challengerGrade",
                "type": "uint256"
            }
        ],
        "name": "challengeSubmission",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "challengeId",
                "type": "bytes32"
            },
            {
                "internalType": "bool",
                "name": "supportChallenger",
                "type": "bool"
            }
        ],
        "name": "vote",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "challengeId",
                "type": "bytes32"
            }
        ],
        "name": "voteStatus",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "supportChallenger",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "supportSubmitter",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

function encodeGrade(grade) {
    const authenticator = (grade.grader === "PSA") ? 1 : (grade.grader === "CSG") ? 2 : 0;
    const gradeParts = (grade.grade + "").split(".");
    // Authenticator code + integral grade + fractional grade + subgrades/qualifiers
    const noQualifier = 255;
    const numericGrade = [authenticator, parseInt(gradeParts[0]), parseInt(gradeParts[1]), noQualifier, 0, 0, 0, 0, 0, 0, 0];
    let enc = ethers.utils.zeroPad(numericGrade, 32);
    console.log("Encoded grade", grade, "=>", enc);
    return BigNumber.from(enc);
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            connection: "Not Connected - Use the Metamask Extension or App with the xDai Mainnet",
            sender: "Connect Wallet",
            xdaiBalance: 0,
            submissions: Map({}),
            contract: null,
            contractView: null,
            dao: null,
            txModalOpen: false,
            txHash: null,
        };

        this.supportSubmission = this.supportSubmission.bind(this);
        this.challenge = this.challenge.bind(this);
        this.vote = this.vote.bind(this);
    }

    async componentDidMount() {
        console.log("Fetching DAO data", DAO_URL);
        const daoResponse = await fetch(DAO_URL, {method: 'GET', mode: 'cors'});
        const dao = await daoResponse.json(); //extract JSON from the http response
        console.log("Got DAO data", dao);
        this.setState({dao: dao})
        // First, load the submissions
        const response = await fetch(SUBMISSIONS_URL, {method: 'GET', mode: 'cors'});
        let submissions = await response.json(); //extract JSON from the http response
        console.log("Got submissions", submissions);
        this.setState({submissions: Map(submissions)})

        const contractAddress = dao.StandAloneContracts[1].address;
        // Then, set the contract and initialize account
        console.log('Contract address', contractAddress);
        await window.ethereum.enable();
        // A Web3Provider wraps a standard Web3 provider, which is
        // what Metamask injects as window.ethereum into each page
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const contractView = new ethers.Contract(contractAddress, abi, provider);
        this.setState({contractView: contractView});
        for (const key in submissions) {
            let value = submissions[key];
            console.log("Checking if submission is challenge", value);
            if (value.status.Challenged) {
                let challengeId = value.status.Challenged.challengeId;
                console.log("Querying voteStatus for challenge", challengeId);
                contractView.voteStatus(challengeId).then(status => {
                    console.log("Injecting the vote status into the challenge entry", challengeId, status);
                    value._voteStatus = {
                        supportChallengerVotes: status[0] / BigNumber.from(10).pow(18),
                        supportSubmitterVotes: status[1] / BigNumber.from(10).pow(18),
                    };
                    this.setState({submissions: this.state.submissions.set(key, value)});
                });
            }
        }
        // The Metamask plugin also allows signing transactions to
        // send ether and pay to change state within the blockchain.
        // For this, you need the account signer...
        const signer = provider.getSigner();
        const sender = await signer.getAddress();
        console.log('The sender address', sender);
        this.setState({sender});
        const weiBalance = await provider.getBalance(sender);
        console.log('The balance in wei', weiBalance);
        const xdaiBalance = weiBalance / BigNumber.from(10).pow(18);
        // let blockNumber = await provider.getBlockNumber();
        // console.log("Block number", blockNumber);
        this.setState({ethBalance: xdaiBalance.toString(10)});
        this.setState({connection: `Connected as: ${sender} - Balance: ${xdaiBalance} xDai`})

        const contract = new ethers.Contract(contractAddress, abi, signer);
        console.log("Contract initialized", contract);
        this.setState({contract: contract});

    }

    async supportSubmission(submissionHash, deposit) {
        console.log('Supporting submission', submissionHash, "with deposit", deposit);
        const contract = this.state.contract;
        if (contract === null) {
            throw new Error('Contract not initialized');
        }
        let value = ethers.utils.parseEther(deposit);
        console.log("Calling", contract.address, "supportSubmission(", this.state.dao.Avatar, submissionHash, ") value:", value);
        const response = await contract.supportSubmission(this.state.dao.Avatar, submissionHash, {
            value: value,
        });
        console.log("Called the supportSubmission fn", response);
        this.setState({txHash: response.hash});
        this.onOpen();
    }

    async challenge(submissionHash, submission, grade) {
        console.log('Challenging submission', submissionHash, submission);
        const contract = this.state.contract;
        if (contract === null) {
            throw new Error('Contract not initialized');
        }
        let encodedGrade = encodeGrade(grade);
        const response = await contract.challengeSubmission(this.state.dao.Avatar, submissionHash, encodedGrade, {
            value: ethers.utils.parseEther(submission.deposit),
        });
        console.log("Called the challengeSubmission fn", response);
        this.setState({txHash: response.hash});
        this.onOpen();
    }

    async vote(challengeId, supportChallenger) {
        console.log('Vote on challenge', challengeId, supportChallenger);
        const contract = this.state.contract;
        if (contract === null) {
            throw new Error('Contract not initialized');
        }
        const response = await contract.vote(challengeId, supportChallenger);
        this.setState({txHash: response.hash});
        this.onOpen();
    }

    onOpen() {
        this.setState({txModalOpen: true});
    }

    onClose() {
        this.setState({txModalOpen: false});
    }


    render() {
        const submissions = this.state.submissions;

        return (
            <ChakraProvider theme={theme}>
                <Heading>{this.state.connection}</Heading>
                <SubmissionList submissions={submissions} onChallenge={this.challenge}
                                onSupportSubmission={this.supportSubmission} onVote={this.vote}/>
                <Modal onClose={this.onClose.bind(this)} isOpen={this.state.txModalOpen} isCentered>
                    <ModalOverlay/>
                    <ModalContent>
                        <ModalHeader>Tx Sent to xDai</ModalHeader>
                        <ModalCloseButton/>
                        <ModalBody>
                            <p>You just submitted a transaction. Refresh the page after it is mined and confirmed to
                                view the update state of your submission.</p>
                            <p>Tx Hash: {this.state.txHash}</p>
                            <p>View on <Link href={`https://blockscout.com/xdai/mainnet/tx/${this.state.txHash}`}
                                             target="_blank" isExternal>xDai
                                BlockScout</Link></p>
                            <p>This box should show a progress indicator until the tx is mined</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={this.onClose.bind(this)}>Close</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </ChakraProvider>
        );
    }
}

export default App;
