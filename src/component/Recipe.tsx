import React from 'react';
import { Recipe as RecipeData } from '../data';
import Table from 'react-bootstrap/Table';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { FaTimes } from 'react-icons/fa';
import { TiArrowSortedUp, TiArrowSortedDown } from 'react-icons/ti';

export interface Props {
    recipe: RecipeData,
    amountOfMachines: number,
    canMoveUp: boolean,
    canMoveDown: boolean,
    onDelete: () => void,
    onMoveUp: () => void,
    onMoveDown: () => void,
}
export interface State { }

export default class Recipe extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
        };
    }

    renderInputOutput(index: number) {
        let recipe = this.props.recipe;
        let machine = recipe.machine;
        let machine_count = this.props.amountOfMachines;

        let input = recipe.inputs[index];
        let output = recipe.outputs[index];
        let crafting_multiplier = (machine.speed / recipe.craft_time) * machine_count;
        return <tr key={index}>
            <td>{input ? input.item : ""}</td>
            <td>{input ? (input.amount * crafting_multiplier).toFixed(2) : ""}</td>
            <td>{output ? output.item : ""}</td>
            <td>{output ? (output.amount * crafting_multiplier).toFixed(2) : ""}</td>
        </tr>
    }

    render() {
        let recipe = this.props.recipe;
        let input_output_count = recipe.inputs.length > recipe.outputs.length ? recipe.inputs.length : recipe.outputs.length;
        return <Card>
            <Card.Header>
                <h3>{recipe.name}</h3>
                <span style={{ float: 'right' }}>
                    <b>{this.props.amountOfMachines.toFixed(1)}x</b>
                    {' '}
                    {recipe.machine.name}
                </span>
            </Card.Header>
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Input</th>
                        <th />
                        <th>Output</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {Array(input_output_count).fill(0).map((_, n) => this.renderInputOutput(n))}
                </tbody>
            </Table>
            <Card.Footer>
                <Button variant="outline-secondary" disabled={!this.props.canMoveUp} onClick={this.props.onMoveUp}>
                    <TiArrowSortedUp />
                </Button>
                {' '}
                <Button variant="outline-secondary" disabled={!this.props.canMoveDown} onClick={this.props.onMoveDown}>
                    <TiArrowSortedDown />
                </Button>
                <Button variant="danger" style={{ float: 'right' }} onClick={this.props.onDelete}>
                    <FaTimes />
                </Button>
            </Card.Footer>
        </Card>
    }
}