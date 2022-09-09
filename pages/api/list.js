// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { Client } = require("pg");

export default async function list(req, res) {
    if (req.method === 'POST') {
        const { body } = req;
        const { config } = body;

        if (!config) {
            res.status(400).json({ error: 'Missing config.' });
            return;
        }

        const { host, authorization, ssl, cluster } = config;
        if (!host || !authorization) {
            res.status(400).json({ error: 'Missing config fields.' });
            return;
        }

        const { user, password } = authorization;
        const client = new Client({
            host,
            port: 6875,
            user,
            password,
            database: "materialize",
            ssl: ssl || host.startsWith("https://")
        });

        try {
            await client.connect();

            if (cluster) {
                await client.query(`SET CLUSTER = ${cluster}`);
            }

            const databasesP = client.query(`SELECT * FROM mz_databases;`);;
            const schemasP = client.query(`SELECT * FROM mz_schemas;`);;
            const dataflowsP = client.query(`
                SELECT R.id, R.name, R.records, S.elapsed
                FROM mz_catalog.mz_records_per_dataflow_global R
                JOIN (
                    SELECT id as d_id, sum(elapsed_ns) / 1000000000 AS elapsed
                    FROM mz_catalog.mz_scheduling_elapsed
                    GROUP BY id
                ) S ON (R.id = S.d_id)
                -- JOIN mz_dataflows D ON (R.id = D.id)
                -- JOIN mz_objects O ON (O.id = D.oid)
                WHERE name NOT LIKE 'Dataflow: mz_catalog.%'
                ORDER BY elapsed DESC;
            `);
            const objectsP = client.query("SELECT schema_id, name, type FROM mz_objects WHERE type NOT IN ('type', 'function', 'secret', 'connection') ;");

            const [
                { rows: databases },
                { rows: schemas},
                { rows: dataflows },
                { rows: objects }
            ] = await Promise.all([databasesP, schemasP, dataflowsP, objectsP]);

            res.status(200).json({ databases, schemas, dataflows, objects });
        } catch (err) {
            res.status(500).json({ error: err.toString() });
        }
    }
}