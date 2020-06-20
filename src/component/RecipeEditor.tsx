import React from 'react';
import { Recipe, ItemAmount } from '../data';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { storage } from '../storage';
import { FaTrashAlt } from 'react-icons/fa';
import { isNullOrUndefined } from 'util';

export interface Props {
    recipe: Recipe | null;
    onCancel: () => void;
    onSave: (recipe: Recipe) => void;
}
export interface State {
    recipe: Recipe | null,
    craft_time: string,
}

function cloneRecipe(recipe: Recipe, additionalInputOutput: boolean = false): Recipe {
    let result: Recipe = {
        name: recipe.name,
        craft_time: recipe.craft_time,
        machine: {
            name: recipe.machine.name,
            speed: recipe.machine.speed,
        },
        inputs: [],
        outputs: [],
    };

    for (const input of recipe.inputs) {
        result.inputs.push({
            item: input.item,
            amount: input.amount,
        });
    }
    if (additionalInputOutput) {
        result.inputs.push({ item: '', amount: 0 });
    }
    for (const output of recipe.outputs) {
        result.outputs.push({
            item: output.item,
            amount: output.amount,
        });
    }
    if (additionalInputOutput) {
        result.outputs.push({ item: '', amount: 0 });
    }

    return result;
}
export default class RecipeEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = RecipeEditor.getDerivedStateFromProps(props, { recipe: null, craft_time: "" });
    }

    static getDerivedStateFromProps(nextProps: Props, oldState: State) {
        if (nextProps.recipe !== null && oldState.recipe === null) {
            return {
                recipe: cloneRecipe(nextProps.recipe, true),
                craft_time: nextProps.recipe.craft_time.toString()
            };
        } else if (nextProps.recipe === null) {
            return {
                recipe: null,
                craft_time: '0',
            };
        } else {
            return oldState;
        }
    }

    updateName(value: string) {
        if (this.state.recipe === null) return;
        let recipe: Recipe = cloneRecipe(this.state.recipe);
        recipe.name = value;
        this.setState({
            recipe
        })
    }

    updateMachine(machineName: string) {
        let machine = storage.machines.find(m => m.name === machineName);
        if (this.state.recipe === null || machine === null) return;
        let recipe: Recipe = cloneRecipe(this.state.recipe);
        recipe.machine = machine!;
        this.setState({
            recipe
        })
    }

    updateCraftTime(newCraftTime: string) {
        this.setState({
            craft_time: newCraftTime
        });
    }

    commitCraftTime() {
        try {
            let time = parseFloat(this.state.craft_time);
            if (!isNaN(time) && !isNullOrUndefined(time)) {
                if (this.state.recipe === null) return;
                let recipe: Recipe = cloneRecipe(this.state.recipe);
                recipe.craft_time = time;
                this.setState({
                    craft_time: time.toString(),
                    recipe
                });
                return;
            }
        } catch { }
        let craft_time = this.state.recipe ? this.state.recipe.craft_time.toString() : '0';
        this.setState({
            craft_time
        });
    }

    render() {
        let handleSave = () => {
            let recipe = this.state.recipe;
            if (recipe !== null) {
                recipe.inputs = recipe.inputs.filter(i => i.item !== "" && i.amount > 0);
                recipe.outputs = recipe.outputs.filter(i => i.item !== "" && i.amount > 0);
                this.props.onSave(recipe);
            }
        };
        let hasRecipe = this.state.recipe !== null;
        let recipe: Recipe = this.state.recipe || emptyRecipe;
        return <Modal show={hasRecipe} onHide={this.props.onCancel} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Edit recipe</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Row} controlId="recipe_name">
                        <Form.Label column sm="2">Name</Form.Label>
                        <Col sm="10">
                            <Form.Control value={recipe.name} onChange={e => this.updateName(e.target.value)} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="machine">
                        <Form.Label column sm="2">Machine</Form.Label>
                        <Col sm="10">
                            <Form.Control as="select" value={recipe.machine.name} onChange={e => this.updateMachine(e.target.value)}>
                                {storage.machines.map(machine => <option key={machine.name}>{machine.name}</option>)}
                            </Form.Control>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId="craft_time">
                        <Form.Label column sm="2">Craft time</Form.Label>
                        <Col sm="10">
                            <Form.Control
                                value={this.state.craft_time}
                                onChange={e => this.updateCraftTime(e.target.value)}
                                onBlur={() => this.commitCraftTime()}
                            />
                        </Col>
                    </Form.Group>
                    <b>Inputs</b>
                    {this.renderItemList(recipe.inputs, (recipe, inputs) => recipe.inputs = inputs)}
                    <b>Outputs</b>
                    {this.renderItemList(recipe.outputs, (recipe, outputs) => recipe.outputs = outputs)}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={() => this.deleteRecipe()}><FaTrashAlt /></Button>
                <Button variant="danger" onClick={this.props.onCancel}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save</Button>
            </Modal.Footer>
        </Modal>
    }

    renderItemList(list: ItemAmount[], callback: (recipe: Recipe, newItemList: ItemAmount[]) => void) {
        let itemTextChanged = (item: ItemAmount, index: number, newText: string) => {
            list[index].item = newText;
            if (index === list.length - 1) {
                list.push({
                    item: '',
                    amount: 0
                });
            }
            let recipe = cloneRecipe(this.state.recipe!);
            callback(recipe, list);
            this.setState({ recipe });
        };
        let itemAmountChanged = (item: ItemAmount, index: number, newAmount: string) => {
            list[index].amount = parseFloat(newAmount) || list[index].amount;
            if (index === list.length - 1) {
                list.push({
                    item: '',
                    amount: 0
                });
            }
            let recipe = cloneRecipe(this.state.recipe!);
            callback(recipe, list);
            this.setState({ recipe });
        };

        return list.map((item, index) => <Form.Group as={Row} key={index}>
            <Col sm="10">
                <Form.Control value={item.item} onChange={e => itemTextChanged(item, index, e.target.value)} />
            </Col>
            <Col sm="2">
                <Form.Control value={item.amount} onChange={e => itemAmountChanged(item, index, e.target.value)} />
            </Col>
        </Form.Group>);
    }

    deleteRecipe() {
        if (this.state.recipe === null) return;
        let recipe = this.state.recipe!;
        let index = storage.recipes.findIndex(r => r.name === recipe.name);
        if (index !== -1) {
            storage.recipes.splice(index, 1);
            storage.save();
            this.props.onCancel();
        }
    }
}

export var emptyRecipe: Recipe = {
    name: '',
    machine: storage.machines[0],
    inputs: [],
    outputs: [],
    craft_time: 1,
};
