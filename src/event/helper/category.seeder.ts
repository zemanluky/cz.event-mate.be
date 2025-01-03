import {Category, type ICategory} from "../schema/db/category.schema.ts";

const categories: Array<Omit<ICategory,'_id'>> = [
    { name: "Párty", description: "Všechny domácí, i veřejné párty, zkrátka akce, kde se bude člověk bavit." },
    { name: "Hudební akce", description: "Koncerty, ať už ve velkém koncertním sále nebo v malé hospůdce." },
    { name: "Promítání", description: "Promítání filmů, dokumentů, seriálů. A to doma, nebo v nějakém niche kině." },
    { name: "Sporty", description: "Sportovní eventy, včetně těch, které můžete jen sledovat." },
    { name: "Umění a výstavy", description: "Výstavy umění, historie či jiné zajímavé události." },
    { name: "Jídlo a čajové dýchánky", description: "Přátelská setkání, nebo třeba velké cuppingové akce." },
    { name: "Vědecké", description: "Různé sešlosti s vědeckou tématikou, setkání a představení nových objevů." },
    { name: "Jiné", description: "Cokoliv, co se nevešlo do nejčastějších kategorií." },
];

/**
 * Seeds the database with the default categories.
 */
export async function seedCategories(): Promise<void> {
    if ((await Category.countDocuments()) > 0) return;

    await Category.insertMany(categories);
}