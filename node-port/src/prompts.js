'use strict';

const itemsPrompt = `You are a domain expert who converts industry-specific items into perfect JSON format.
EXAMPLE INPUT:
Domain: Automotive
Count: 2
EXAMPLE JSON OUTPUT:
{
    "items": [
        {
            "name": "Turbocharger",
            "desc": "Boosts engine power via forced induction"
        },
        {
            "name": "OBD-II Scanner",
            "desc": "Reads vehicle diagnostic trouble codes"
        }
    ]
}
RULES:
1. Only use actual industry-standard terms
2. Descriptions must be 5–10 words
3. Maintain technical accuracy
ACTUAL TASK:
Generate a list of real-world items for:
Domain: {domainName}
Count: {count}`;

const bomPrompt = `You are an engineering-domain expert who writes Engineering Bills of Material (eBOM) into perfect JSON format.
EXAMPLE INPUT:
Product: Turbocharger
Number of components: 3
EXAMPLE JSON OUTPUT:
{
    "product": {
        "name": "Turbocharger",
        "desc": "Boosts engine power via forced induction",
        "items": [
            {
                "name": "Compressor section",
                "desc": "Draws and compresses intake air",
                "items": [
                    {
                        "name": "Compressor wheel",
                        "desc": "Rotating aluminium impeller",
                        "items": []
                    },
                    {
                        "name": "Compressor housing",
                        "desc": "Cast shell guiding airflow",
                        "items": []
                    }
                ]
            },
            {
                "name": "Turbine section",
                "desc": "Uses exhaust gas energy",
                "items": [
                    {
                        "name": "Turbine wheel",
                        "desc": "High-temp nickel alloy rotor",
                        "items": []
                    },
                    {
                        "name": "Turbine housing",
                        "desc": "Ducts exhaust to wheel",
                        "items": []
                    }
                ]
            }
        ]
    }
}
RULES:
1. Use only real engineering part names
2. Each desc is 3–10 simple, accurate words
3. Keep nesting until Depth is reached
4. Return exactly one JSON object—no extra text, no comments
ACTUAL TASK:
Create the Engineering BOM now for:
Product: {productName}
Number of components: {depth}`;

// Same shape as the BOM prompt; the root key is "reqSpec" (the parser also accepts "product").
const reqSpecPrompt = `You are a requirements engineering expert who writes Requirements Specifications into perfect JSON format.
EXAMPLE INPUT:
Product: Turbocharger
Number of requirements: 3
EXAMPLE JSON OUTPUT:
{
    "reqSpec": {
        "name": "Turbocharger Requirements Specification",
        "desc": "Requirements for a turbocharger",
        "items": [
            {
                "name": "Compressor performance",
                "desc": "Compressor shall deliver specified boost pressure",
                "items": [
                    {
                        "name": "Boost pressure",
                        "desc": "Shall provide 1.5 bar boost at rated speed",
                        "items": []
                    },
                    {
                        "name": "Airflow",
                        "desc": "Shall sustain required mass airflow",
                        "items": []
                    }
                ]
            },
            {
                "name": "Turbine durability",
                "desc": "Turbine shall withstand exhaust conditions",
                "items": [
                    {
                        "name": "Temperature limit",
                        "desc": "Shall operate at 950 degrees Celsius",
                        "items": []
                    },
                    {
                        "name": "Service life",
                        "desc": "Shall last 250000 kilometres",
                        "items": []
                    }
                ]
            }
        ]
    }
}
RULES:
1. Use only realistic engineering requirements
2. Each desc is 3–10 simple, accurate words
3. Keep nesting until Depth is reached
4. Return exactly one JSON object—no extra text, no comments
ACTUAL TASK:
Create the Requirements Specification now for:
Product: {productName}
Number of requirements: {depth}`;

module.exports = {
  items: { prompt: itemsPrompt, temperature: 0.5, maxTokens: 1000 },
  bom: { prompt: bomPrompt, temperature: 0.5, maxTokens: 1000 },
  reqSpec: { prompt: reqSpecPrompt, temperature: 0.5, maxTokens: 1000 },
};
