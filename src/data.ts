export interface Recipe {
    name: string;
    machine: Machine;
    inputs: ItemAmount[];
    outputs: ItemAmount[];
    craft_time: number;
}

export class RecipeWithCount {
    recipe: Recipe;
    count: number;

    constructor(recipe: Recipe) {
        this.recipe = recipe;
        this.count = 1;
    }
}

export interface Machine {
    name: string;
    speed: number;
}

export interface ItemAmount {
    item: string;
    amount: number;
}

export class Schematic {
    recipes: RecipeWithCount[] = [];
    goal: ItemAmount;
    additional_inputs: ItemAmount[] = [];
    additional_outputs: ItemAmount[] = [];

    constructor(goal: ItemAmount) {
        this.goal = goal;
    }

    add(recipe: Recipe) {
        this.recipes.push(new RecipeWithCount(recipe));
    }

    calculate() {
        this.additional_inputs = [];
        this.additional_outputs = [];
        let goalRecipe: Recipe | null = null;
        for (const recipe of this.recipes) {
            let goal_output = recipe.recipe.outputs.find(o => o.item === this.goal.item);
            if (goal_output) {
                let machine_count = calculateMachineCount(recipe.recipe, goal_output, this.goal);
                recipe.count = machine_count;
                goalRecipe = recipe.recipe;

                let crafting_multiplier = (recipe.recipe.machine.speed / recipe.recipe.craft_time) * machine_count;
                for (const input of recipe.recipe.inputs) {
                    this.additional_inputs.push({ amount: input.amount * crafting_multiplier, item: input.item });
                }
                for (const output of recipe.recipe.outputs.filter(o => o.item !== this.goal.item)) {
                    this.additional_outputs.push({ amount: output.amount * crafting_multiplier, item: output.item });
                }
            } else {
                recipe.count = 0;
            }
        }

        let has_updated = true;
        let update_count = 0;

        while (has_updated && update_count < 1000) {
            update_count++;
            has_updated = false;
            for (const recipe of this.recipes.filter(r => r.recipe !== goalRecipe)) {
                has_updated = recalculateRecipeAmount(this.additional_inputs, this.additional_outputs, recipe) || has_updated;
            }
            this.balanceInputAndOutput();
        }

        if (update_count === 100) {
            console.error("Could not finish calculating the schematic, update_count reached " + update_count);
        }

    }

    hasRecipe(recipe: Recipe) {
        return this.recipes.some(r => r.recipe.name === recipe.name);
    }

    balanceInputAndOutput() {

        for (const input of this.additional_inputs) {
            for (const output of this.additional_outputs) {
                if (input.item !== output.item) {
                    continue;
                }
                let removeInput = (input: ItemAmount) => {
                    let index = this.additional_inputs.findIndex(i => i.item === input.item);
                    this.additional_inputs.splice(index, 1);
                };
                let removeOutput = (output: ItemAmount) => {
                    let index = this.additional_outputs.findIndex(i => i.item === output.item);
                    this.additional_outputs.splice(index, 1);
                };
                if (input.amount === output.amount) {
                    removeInput(input);
                    removeOutput(output);
                } else if (input.amount > output.amount) {
                    input.amount -= output.amount;
                    removeOutput(output);
                } else if (output.amount > input.amount) {
                    output.amount -= input.amount;
                    removeInput(input);
                }
            }
        }
    }
}

function calculateMachineCount(recipe: Recipe, output: ItemAmount, goal: ItemAmount) {
    let crafting_time = recipe.craft_time / recipe.machine.speed;
    let craft_count_required = goal.amount / output.amount;
    let machine_count = craft_count_required * crafting_time;
    return machine_count;
}

function stackOrAddTo(list: ItemAmount[], newAmount: ItemAmount) {
    for (const item of list) {
        if (item.item === newAmount.item) {
            item.amount += newAmount.amount;
            return;
        }
    }
    list.push(newAmount);
}

function recalculateRecipeAmount(inputs: ItemAmount[], outputs: ItemAmount[], recipe: RecipeWithCount) {
    for (const goal of inputs) {
        const available_output = recipe.recipe.outputs.find(o => o.item === goal.item);
        if (available_output == null) continue;

        var machine_count = calculateMachineCount(recipe.recipe, available_output, goal);
        recipe.count += machine_count;

        var index = inputs.findIndex(o => o.item === goal.item);
        inputs.splice(index, 1);

        let crafting_multiplier = (recipe.recipe.machine.speed / recipe.recipe.craft_time) * machine_count;

        for (const otherOutput of recipe.recipe.outputs.filter(o => o.item !== goal.item)) {
            stackOrAddTo(outputs, { item: otherOutput.item, amount: otherOutput.amount * crafting_multiplier });
        }
        for (const input of recipe.recipe.inputs) {
            stackOrAddTo(inputs, { item: input.item, amount: input.amount * crafting_multiplier });
        }

        return true;
    }
    return false;
}