import React from 'react';
import { Schematic as SchematicData, ItemAmount, Recipe as RecipeData } from '../data';
import Recipe from './Recipe';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import { FaRegArrowAltCircleLeft, FaPencilAlt, FaPlus } from 'react-icons/fa';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { storage } from '../storage';
import RecipeEditor, { emptyRecipe } from './RecipeEditor';

export interface Props {
}

export interface State {
    schematic: SchematicData,
    editRecipe: RecipeData | null,
}

export default class Schematic extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        let schematic = new SchematicData({
            item: "Iron sheet coil",
            amount: 45
        });

        schematic.calculate();

        this.state = {
            schematic,
            editRecipe: null,
        };
    }

    setGoalItem(item: string) {
        let schematic = this.state.schematic;
        schematic.goal.item = item;
        schematic.calculate();
        this.setState({
            schematic
        })
    }

    setGoalAmount(amount: string) {
        let schematic = this.state.schematic;

        schematic.goal.amount = parseFloat(amount) || schematic.goal.amount;
        schematic.calculate();
        this.setState({
            schematic
        })
    }

    render() {
        let schematic = this.state.schematic;
        let available_recipes = storage.recipes.filter(r => !schematic.hasRecipe(r));
        let suggested_recipes = available_recipes.filter(recipe => {
            for (const recipe_output of recipe.outputs) {
                if (recipe_output.item === schematic.goal.item) {
                    return true;
                }
                for (const schematic_input of schematic.additional_inputs) {
                    if (recipe_output.item === schematic_input.item) {
                        return true;
                    }
                }
            }
            return false
        });
        let other_recipes = available_recipes.filter(r => suggested_recipes.every(r2 => r2.name !== r.name));
        return <>
            <Container fluid>

                <Row>
                    <Col>
                        <b>Goal: </b>
                        {' '}
                        <input type="text" value={this.state.schematic.goal.amount} size={3} onChange={e => this.setGoalAmount(e.target.value)} />
                        {' '}
                        <select value={this.state.schematic.goal.item} onChange={e => this.setGoalItem(e.target.value)}>
                            {storage.allItems().map(item => <option>{item}</option>)}
                        </select>
                        {
                            schematic.recipes.map((recipe, index) => <Recipe
                                key={index}
                                recipe={recipe.recipe}
                                amountOfMachines={recipe.count}
                                canMoveUp={index > 0}
                                canMoveDown={index < schematic.recipes.length - 1}
                                onDelete={() => this.removeRecipe(recipe.recipe)}
                                onMoveUp={() => this.swapRecipes(index - 1, index)}
                                onMoveDown={() => this.swapRecipes(index, index + 1)}
                            />)
                        }
                    </Col>
                    <Col>
                        <Row>
                            <Col>
                                <h2>Recipes</h2>
                            </Col>
                            <Button variant="outline-primary" onClick={() => this.newRecipe()}><FaPlus /></Button>
                        </Row>
                        {this.renderRecipeList("Suggested", suggested_recipes)}
                        {this.renderRecipeList("Other", other_recipes)}
                    </Col>
                    <Col>
                        <Card>
                            <Card.Header>Additional inputs</Card.Header>
                            {render_item_list(schematic.additional_inputs)}
                        </Card>
                        <Card>
                            <Card.Header>Additional outputs</Card.Header>
                            {render_item_list(schematic.additional_outputs)}
                        </Card>
                        <Card>
                            <Card.Header>Machines required</Card.Header>
                            {this.renderMachineList()}
                        </Card>

                    </Col>
                </Row>
            </Container>
            <RecipeEditor recipe={this.state.editRecipe} onSave={r => this.saveRecipe(r)} onCancel={() => this.resetEditRecipe()} />
        </>
    }

    renderRecipeList(title: string, recipes: RecipeData[]) {
        if (recipes.length === 0) return <></>;
        return <>
            <b>{title}</b>
            {recipes.map((recipe, index) => this.renderRecipe(recipe, index))}
        </>
    }

    renderMachineList() {
        return <Table size="sm">
            <thead>
                <tr>
                    <th>Recipe</th>
                    <th>Machine</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {this.state.schematic.recipes.map((recipe, index) => <tr key={index}>
                    <td>{recipe.recipe.name}</td>
                    <td>{recipe.recipe.machine.name}</td>
                    <td>{recipe.count.toFixed(1)}</td>
                </tr>)}
            </tbody>
        </Table>;
    }

    newRecipe() {
        this.setState({
            editRecipe: emptyRecipe
        });
    }

    resetEditRecipe() {
        this.state.schematic.calculate();
        this.setState({
            editRecipe: null
        });
    }

    saveRecipe(recipe: RecipeData) {
        let index = storage.recipes.findIndex(r => r.name === recipe.name);
        if (index !== -1) {
            storage.recipes[index] = recipe;
        } else {
            storage.recipes.push(recipe);
        }
        storage.save();
        this.resetEditRecipe();
    }

    swapRecipes(firstIndex: number, secondIndex: number) {
        let schematic = this.state.schematic;
        if (firstIndex >= 0 && secondIndex >= 0 && firstIndex < schematic.recipes.length && secondIndex < schematic.recipes.length) {
            let tmp = schematic.recipes[firstIndex];
            schematic.recipes[firstIndex] = schematic.recipes[secondIndex];
            schematic.recipes[secondIndex] = tmp;
            this.setState({
                schematic
            });
        }
    }

    removeRecipe(recipe: RecipeData) {
        let schematic = this.state.schematic;
        let index = schematic.recipes.findIndex(r => r.recipe.name === recipe.name);
        if (index !== -1) {
            schematic.recipes.splice(index, 1);
            schematic.calculate();
            this.setState({
                schematic
            });
        }
    }

    renderRecipe(recipe: RecipeData, index: number) {
        let handleAddClick = (click: React.MouseEvent) => {
            click.preventDefault();
            let schematic = this.state.schematic;
            schematic.add(recipe);
            schematic.calculate();
            this.setState({
                schematic
            });
        };
        let handleEditClick = () => {
            this.setState({
                editRecipe: recipe,
            });
        };
        return <Row key={index}>
            <Button variant="outline-primary" as={Col} onClick={handleAddClick}>
                <FaRegArrowAltCircleLeft /> {recipe.name}
            </Button>
            <Button variant="outline-secondary" onClick={handleEditClick}>
                <FaPencilAlt />
            </Button>
        </Row>;
    }
}

function render_item_list(items: ItemAmount[]) {
    return <Table size="sm">
        <thead>
            <tr>
                <th>Item</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            {items.map((item, index) => <tr key={index}><td>{item.item}</td><td>{item.amount.toFixed(2)}</td></tr>)}
        </tbody>
    </Table>;
}