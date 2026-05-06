import { z } from 'zod'

const CardSchema = z.object({
	name: z.string().min(1, 'Name is required!'),
	stock: z.coerce.number().default(0),
	location: z.string().min(1, 'Location is required!'),
	category: z.string().min(1, 'Category is required!'),
	subCategory: z.string().min(1, 'Subcategory is required!'),
	videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
	file: z.unknown().optional(),
	sectionId: z.coerce.number({ error: 'Section id is required!' }),
	
	// IDR Price fields
	priceIdr: z.coerce.number().positive('IDR price is required!'),
	priceNoteIdr: z.string().min(1, 'IDR price note is required!'),
	
	// SGD Price fields
	priceSgd: z.coerce.number().positive('SGD price is required!'),
	priceNoteSgd: z.string().min(1, 'SGD price note is required!')
})

export default CardSchema