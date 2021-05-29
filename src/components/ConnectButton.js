import React, { Component } from "react";
import {Button} from "@chakra-ui/react"
import { createBreakpoints } from "@chakra-ui/theme-tools"
import MetaMaskOnboarding from "@metamask/onboarding";
import  "../assets/css/ConnectButton.css";

class ConnectButton extends Component {
    breakpoints = createBreakpoints({
        sm: "30em",
        md: "48em",
        lg: "62em",
        xl: "80em",
        "2xl": "96em",
    })

    count = 0;

    state = {
        Account : '',
    }

    //check to see if MetaMask is installed
    isMetaMaskInstalled = () =>{
        //Have to check the ethereum binding on the window object to see if it's installed
        const { ethereum } = window;
        return Boolean(ethereum && ethereum.isMetaMask);
    };

    //This will start the onboarding process for install Metamask 
    onClickInstall = () =>{
        //We create a new MetaMask onboarding object to use in our app
        const onboarding = new MetaMaskOnboarding( this.props.forwarderOrigin );
        //On this object we have startOnboarding which will start the onboarding process for our end user
        onboarding.startOnboarding();
    };

    //this is will connect to wallet
    onClickConnect = () =>{
        const { ethereum } = window;
        try {
            // Will open the MetaMask UI
            // You should disable this button while the request is pending!
            ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            console.error(error);
        }
    };
 
    // this will get the number account from  the wallet
    getAccount () {
        if( this.count === 0){
            const { ethereum } = window;
            ethereum.request({method: 'eth_accounts',})
            .then((result) => {
                this.setState({
                    Account : result[0],
                  });
            })
            .catch((error) => {
                return error;
            }); 
            this.count++;
        }
    }

    render(){
        if (!this.isMetaMaskInstalled()) {
            return(
                <Button p={1} m="3" w="120px" colorScheme="linkedin" 
                    onClick={this.onClickInstall}
                    >
                    Install <br/>Metamask!
                </Button>
            );
        } 

        this.getAccount();
        if(this.state.Account === undefined){
            return(
                <Button p={1} w="120px" colorScheme="linkedin"
                    m={{ base: "3em", md: "0em", lg: "1.3em" }}
                    onClick={this.onClickConnect} 
                    >
                    Connect
                </Button>
            );
        }else{
            return (
                <Button p={1} m="1" w="60px" colorScheme="linkedin" isDisabled>
                    {this.state.Account}
                </Button>
            );
        }
        
    }
}
export default ConnectButton;