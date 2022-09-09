// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { Client } = require("pg");

export default async function details(req, res) {
    if (req.method === 'POST') {
        const { body } = req;
        const { config, dataflow } = body;

        if (!config) {
            res.status(400).json({ error: 'Missing config.' });
            return;
        }

        const { host, authorization, ssl } = config;
        if (!host || !authorization || !authorization.user) {
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

            const addressesQuery = client.query(`SELECT DISTINCT
                id, address
            FROM
                mz_catalog.mz_dataflow_addresses
            WHERE
                id
                IN (
                    SELECT
                    id
                    FROM
                    mz_catalog.mz_dataflow_addresses
                    WHERE
                    address[1]
                        = (
                            SELECT DISTINCT
                            address[1]
                            FROM
                            mz_catalog.mz_dataflow_addresses
                            WHERE
                            id = $1
                        )
                ) ORDER BY id ASC;
            `, [dataflow]);

            const operatorsQuery = client.query(`SELECT DISTINCT
                id, name
            FROM
                mz_catalog.mz_dataflow_operators
            WHERE
                id
                IN (
                    SELECT
                    id
                    FROM
                    mz_catalog.mz_dataflow_addresses
                    WHERE
                    address[1]
                        = (
                            SELECT DISTINCT
                            address[1]
                            FROM
                            mz_catalog.mz_dataflow_addresses
                            WHERE
                            id = $1
                        )
                );
            `, [dataflow]);

            const channelsQuery = client.query(`
                SELECT
                id, source_node, target_node, sum(sent) as sent
                FROM
                mz_catalog.mz_dataflow_channels AS channels
                LEFT JOIN mz_catalog.mz_message_counts AS counts
                    ON channels.id = counts.channel AND channels.worker = counts.source_worker
                WHERE
                id
                IN (
                    SELECT
                        id
                    FROM
                        mz_catalog.mz_dataflow_addresses
                    WHERE
                        address[1]
                        = (
                            SELECT DISTINCT
                                address[1]
                            FROM
                                mz_catalog.mz_dataflow_addresses
                            WHERE
                                id = $1
                            )
                    )
                GROUP BY id, source_node, target_node;
            `, [dataflow]);

            const arrangementsQuery = client.query(`SELECT DISTINCT
                id, name, records
            FROM
                mz_catalog.mz_dataflow_operators
            JOIN mz_arrangement_sizes ON (id = operator)
            WHERE
                id
                IN (
                    SELECT
                    id
                    FROM
                    mz_catalog.mz_dataflow_addresses
                    WHERE
                    address[1]
                        = (
                            SELECT DISTINCT
                            address[1]
                            FROM
                            mz_catalog.mz_dataflow_addresses
                            WHERE
                            id = $1
                        )
                )`, [dataflow]);

            const [addresses, operators, channels, arrangements] = await Promise.all([addressesQuery, operatorsQuery, channelsQuery, arrangementsQuery]);
            res.status(200).json({ addresses, arrangements, operators, channels });
        } catch (err) {
            res.status(500).json({ error: err.toString() });
        }
    }
}
