import { z } from 'zod'

const CabinetSchema = z.object({
	name: z.string().min(1, 'Name is required!'),
	maxSlots: z.coerce.number({ error: 'Max slot is required!' })
})

export default CabinetSchema
