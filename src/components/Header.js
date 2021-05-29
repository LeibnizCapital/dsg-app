import * as React from "react";
import {Box,Image} from "@chakra-ui/react"
import { createBreakpoints } from "@chakra-ui/theme-tools"
import ConnectButton from "./ConnectButton";
import logo from "../assets/images/DSG-logo.png";

class AppHeader extends React.Component {

    breakpoints = createBreakpoints({
        sm: "30em",
        md: "48em",
        lg: "62em",
        xl: "80em",
        "2xl": "96em",
    })

    render() {
        return (
            <Box w="100%" h={{ base: "4em", md: "8em", lg: "5em" }} verticalAlign="center" 
                lineHeight="tight" borderWidth="1px" overflow="hidden"
                 d="flex" flexDirection="row" borderColor="linkedin">
                <Box boxSize={{ base: "3.4em", md: "3em", lg: "3em" }} m="2">
                    <Image src={logo} alt="logo" />
                </Box>
                <Box as="h1" flexGrow={1} 
                    mt={{ base: "0.2em", md: "0.5em", lg: "0.5em" }}
                    mx={{ base: "0.2em", md: "0.5em", lg: "1em" }}
                    fontSize={{ base: "1.1em", md: "1.2em", lg: "1.8em" }} >
                    Distributed Synthetic Grading
                </Box>
                <Box>
                    <ConnectButton
                        forwarderOrigin = {this.props.host}
                    />
                </Box>
            </Box>
        );
    }

}

export default AppHeader;