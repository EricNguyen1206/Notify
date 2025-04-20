import { BaseModel } from './base';

export interface Option extends BaseModel {
    title: string;
    description: string;
    image_url: string;
    vote_count: number;
    link: string;
}
