import { z } from 'zod'

const SectionSchema = z.object({
	name: z.string().min(1, 'Name is required!'),
	type: z.string().min(1, 'Type is require!'),
	layout: z.string().min(1, 'Layout is required!'),
	cabinetId: z.coerce.number({ error: 'Cabinet ID is required' })
})

export default SectionSchema
