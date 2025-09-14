export interface GeneratedImage {
  title: string;
  src: string | null;
  original: string | null; // Added for comparison mode
}

export interface DescriptionResponse {
  person: string;
  accessory: string;
}

export interface PhotoShootSession {
  id: string;
  timestamp: number;
  personImage: string;
  accessoryImage: string;
  scenario: string;
  style: string;
  generatedImages: GeneratedImage[];
}
