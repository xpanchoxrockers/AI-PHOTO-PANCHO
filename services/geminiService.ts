import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { DescriptionResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
};

const stylePromptMap: Record<string, string> = {
  'Editorial': "High-end editorial photography style, professional photograph, high resolution, sharp focus, natural colors, realistic depth of field.",
  'Cinematográfico': "Cinematic style, dramatic lighting, high contrast, film grain, anamorphic lens look, moody atmosphere, professional color grading.",
  'Retro': "Vintage film photography style, retro color palette (e.g., Kodachrome, Polaroid), soft focus, authentic film grain, nostalgic feel.",
  'Minimalista': "Minimalist style, clean composition, simple background, negative space, focused on the subject, neutral color palette.",
};

// Step 1: Use a multimodal model to describe the person and accessory to ensure consistency.
const getDescriptionFromImages = async (personImage: string, accessoryImage: string): Promise<DescriptionResponse> => {
  const personMimeType = personImage.substring(personImage.indexOf(':') + 1, personImage.indexOf(';'));
  const accessoryMimeType = accessoryImage.substring(accessoryImage.indexOf(':') + 1, accessoryImage.indexOf(';'));

  const personPart = fileToGenerativePart(personImage, personMimeType);
  const accessoryPart = fileToGenerativePart(accessoryImage, accessoryMimeType);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { text: "Analyze the two provided images. Image 1 contains a person. Image 2 contains an accessory. Provide a detailed, objective description of the person's key visual features (age range, gender presentation, hair style and color, skin tone, prominent facial features, body type) and the clothing they are wearing. Then, provide a detailed, objective description of the accessory (type of object, material, color, shape, details). Return ONLY the JSON object." },
        personPart,
        accessoryPart
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          person: {
            type: Type.STRING,
            description: "Detailed description of the person's appearance."
          },
          accessory: {
            type: Type.STRING,
            description: "Detailed description of the accessory's appearance."
          }
        },
        required: ['person', 'accessory']
      }
    }
  });

  const jsonText = response.text;
  return JSON.parse(jsonText) as DescriptionResponse;
};


// Step 2: Use the descriptions and base images to edit them into three distinct, high-quality images using nanobanana.
const editImageWithPrompt = async (baseImage: string, prompt: string): Promise<string> => {
    const mimeType = baseImage.substring(baseImage.indexOf(':') + 1, baseImage.indexOf(';'));
    const imagePart = fileToGenerativePart(baseImage, mimeType);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                imagePart,
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageMimeType = part.inlineData.mimeType;
            return `data:${imageMimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error('Image editing failed to produce an image.');
};


export const generatePhotoShoot = async (
    personImage: string, 
    accessoryImage: string, 
    scenario: string,
    style: string,
    onProgress: (message: string) => void
): Promise<string[]> => {
  try {
    onProgress('Analizando imágenes...');
    const descriptions = await getDescriptionFromImages(personImage, accessoryImage);
    const { person, accessory } = descriptions;

    const commonPromptSuffix = "Photorealistic, shot on DSLR, 8k, hyper-detailed, vertical format. Ensure the final image is a photograph and not an illustration.";
    const stylePrompt = stylePromptMap[style] || stylePromptMap['Editorial'];

    const prompts = [
      // 1. Full body shot prompt (editing)
      `Using the provided image of a person (${person}), edit it to be a professional full-body studio photograph. The person should be wearing or using the described accessory (${accessory}). Replace the existing background with a seamless, neutral light-gray studio backdrop. Adjust the lighting to be soft and professional, typical of a high-end photoshoot. Maintain the person's pose and appearance exactly. Style: ${stylePrompt}. ${commonPromptSuffix}`,
      // 2. Accessory shot prompt (editing)
      `Take this image of an accessory (${accessory}) and turn it into a high-resolution catalog-style product photo. Isolate the accessory by replacing the background with a pure white one. Add a soft, subtle shadow underneath the object for realism. Ensure the focus is tack-sharp on the product, highlighting its details and texture. Style: ${stylePrompt}. ${commonPromptSuffix}`,
      // 3. Lifestyle shot prompt (editing)
      `Edit this photograph of a person (${person}). Place them in the following scene: ${scenario}. The person should now be wearing or using the described accessory (${accessory}). The final image should be a professional lifestyle photograph. The lighting must be natural and ambient, matching the new environment, and all shadows should be coherent and realistic. The composition should capture a candid moment. Style: ${stylePrompt}. ${commonPromptSuffix}`
    ];
    
    onProgress('Creando retrato de estudio...');
    const result1 = await editImageWithPrompt(personImage, prompts[0]);
    onProgress('Creando foto de producto...');
    const result2 = await editImageWithPrompt(accessoryImage, prompts[1]);
    onProgress('Creando escena de estilo de vida...');
    const result3 = await editImageWithPrompt(personImage, prompts[2]);
    
    return [result1, result2, result3];
    
  } catch (error) {
    console.error("Error in generatePhotoShoot:", error);
    if (error instanceof Error) {
        throw new Error(`Failed during image generation process: ${error.message}`);
    }
    throw new Error("An unknown error occurred during image generation.");
  }
};
