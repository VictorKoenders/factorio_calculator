import { Machine, Recipe } from "./data";

class Storage {
    recipes: Recipe[];

    machines: Machine[] = [
        { name: "Strand casting machine 4", speed: 3 },
        { name: "Blast furnace 4", speed: 3 },
        { name: "Induction furnace 4", speed: 3 },
        { name: "Pellet press 4", speed: 3 },
        { name: "Ore processing machine", speed: 3 },
        { name: "Ore sorting facility", speed: 2 },
        { name: "Ore refinery", speed: 1.5 },
        { name: "Leaching plant", speed: 1.5 },
        { name: "Crafting machine", speed: 2.75 },
        { name: "Filtration unit", speed: 2.25 },
        { name: "Crystallizer", speed: 2.25 },
        { name: "Hydro plant", speed: 2 },
        { name: "Electrolyser", speed: 2.5 },
        { name: "Ore crusher", speed: 3 },
        { name: "Washing plant", speed: 2.25 },
        { name: "Liquifier", speed: 3.75 },
        { name: "Algae farm", speed: 1.5 },
        { name: "Custom", speed: 1 },
    ];

    constructor() {
        this.recipes = [];
        try {
            let recipes = localStorage.getItem("recipes");
            if (recipes != null) {
                this.recipes = JSON.parse(recipes);
                console.log("Loaded " + this.recipes.length + " recipes");
            }
        } catch {
        }
    }

    save() {
        localStorage.setItem("recipes", JSON.stringify(this.recipes));
    }

    allItems() {
        let result: string[] = [];
        for (const recipe of this.recipes) {
            for (const output of recipe.outputs) {
                if (result.some(r => r === output.item)) continue;
                result.push(output.item);
            }
        }

        result.sort();
        return result;
    }
}

export var storage = new Storage();
