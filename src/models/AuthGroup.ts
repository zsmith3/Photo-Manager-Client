import { DBTables } from "../controllers/Database";
import { Model, ModelMeta } from "./Model";

/** AuthGroup model */
export class AuthGroup extends Model {
	/** Person model metadata */
	static meta = new ModelMeta<AuthGroup>({
		modelName: DBTables.AuthGroup,
		props: ["id", "name"]
	});

	id: number;

	/** Name of the auth group */
	name: string;
}
