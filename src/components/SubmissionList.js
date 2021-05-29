import * as React from "react";
import {
    Box,
    Button, FormControl, FormLabel,
    Heading, NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    SimpleGrid, Switch
} from "@chakra-ui/react"


class SubmissionList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            deposit: 0,
            grade: 0,
            supportChallenger: false,
        };
    }

    renderChallenge(submissionHash, submission) {
        return <Box padding={"10px"}>
            <FormControl isRequired>
                <FormLabel>Grade: PSA</FormLabel>
                <NumberInput defaultValue={0} precision={1} step={0.5}
                             onChange={(valueString, value) => this.setState({grade: value})}>
                    <NumberInputField/>
                    <NumberInputStepper>
                        <NumberIncrementStepper/>
                        <NumberDecrementStepper/>
                    </NumberInputStepper>
                </NumberInput>
            </FormControl>
            <Button
                colorScheme="blue"
                onClick={() => this.props.onChallenge(submissionHash, submission, {
                    grader: "PSA",
                    grade: this.state.grade
                })}>Challenge Submission</Button>
        </Box>;
    }

    renderSupportSubmission(submissionHash) {
        return <Box padding={"10px"}>
            <FormControl isRequired>
                <FormLabel>Deposit (in $)</FormLabel>
                <NumberInput defaultValue={0} precision={2} step={0.1}
                             onChange={(valueString) => this.setState({deposit: valueString})}>
                    <NumberInputField/>
                    <NumberInputStepper>
                        <NumberIncrementStepper/>
                        <NumberDecrementStepper/>
                    </NumberInputStepper>
                </NumberInput>
            </FormControl>
            <Button
                colorScheme="teal"
                onClick={() => this.props.onSupportSubmission(submissionHash, this.state.deposit)}>Support
                Submission</Button>
        </Box>;
    }

    renderVote(challenge, predictedGrade, voteStatus) {
        return <Box padding={"10px"}>
            {(voteStatus) ?
                <p><b>Vote Status:</b> Submitter {voteStatus.supportSubmitterVotes.toString()} /
                    Challenger {voteStatus.supportChallengerVotes.toString()}</p> : <span/>}

            <FormControl isRequired>
                <FormLabel>Support the challenger over submitter? PSA {challenge.challengerGrade.grade} vs
                    PSA {predictedGrade.grade}</FormLabel>
                <Switch onChange={evt => {
                    console.log("Vote switch change event", evt);
                    this.setState(prevState => ({
                        supportChallenger: !prevState.supportChallenger
                    }));
                }}/>
            </FormControl>
            <Button
                colorScheme="pink"
                onClick={() => this.props.onVote(challenge.challengeId, this.state.supportChallenger)}>Vote</Button>
        </Box>;
    }

    render() {
        return <SimpleGrid as="ul">
            {this.props.submissions.entrySeq().map(([key, value]) => {
                console.log('Item', key, value);
                return <li>
                    <Box key={key}>
                        <b>{key}</b>
                        <p>{JSON.stringify(value)}</p>
                        {(value.status.Submitted) ? this.renderSupportSubmission(key) : <span/>}
                        {(value.status.Supported) ? this.renderChallenge(key, value) : <span/>}
                        {(value.status.Challenged) ? this.renderVote(value.status.Challenged, value.predictedGrade, value._voteStatus) :
                            <span/>}
                    </Box>
                </li>
            })}
        </SimpleGrid>;
    }
}

export default SubmissionList;