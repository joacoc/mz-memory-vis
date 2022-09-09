import { useEffect, useState } from "react"

const bgColors = {
    "view": "bg-green-100",
    "materialized view": "bg-purple-100",
    "source": "bg-blue-100",
    "table": "bg-orange-100",
    "index": "bg-yellow-100",
}

const textColors = {
    "view": "text-green-800",
    "materialized view": "text-purple-800",
    "source": "text-blue-800",
    "table": "text-orange-800",
    "index": "text-yellow-800",
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function List(props) {
    const { config, onDataflowSelected } = props;
    const [loading, setLoading] = useState(true);
    const [{ dataflows, databases, schemas, objects }, setData] = useState({
        dataflows: [],
        databases: {},
        schemas: {},
        objects: {},
    });

    useEffect(() => {
        if (config) {
            fetch(`/api/list`, {
                body: JSON.stringify({ config }),
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            }).then((r) => {
                r.json().then((data) => {
                    if (!data || data.error) {
                        console.error("Error: ", data);
                    } else {
                        const { dataflows, databases, schemas, objects } = data;
                        const mDatabases = {};
                        const mSchemas = {};
                        const mObjects = {};
                        databases.forEach(({id, name: dbName}) => {
                            mDatabases[id] = dbName;
                            mSchemas[id] = {};
                        });
                        schemas.forEach(({id, name: schemaName, database_id: dbId }) => {
                            if (dbId) {
                                mSchemas[dbId][id] = schemaName;
                                mObjects[id] = {};
                            }
                        });
                        objects.forEach(({ schema_id: schemaId, name: objectName, type }) => {
                            if (schemaId && mObjects[schemaId]) {
                                mObjects[schemaId][objectName] = type;
                            }
                        });

                        setData({
                            dataflows,
                            databases: mDatabases,
                            schemas: mSchemas,
                            objects: mObjects,
                        });
                    }
                }).catch(console.error);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [config]);

    const onRowClick = (r) => {
        onDataflowSelected(r.currentTarget.id);
    }

    return (
        loading === false && <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Name
                                    </th>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Database
                                    </th>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Schema
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Type
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Records
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Elapsed
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {dataflows && dataflows.map(({ id, name, records, elapsed }) => {
                                    const [, database, schema, objectName] = name.match(/^Dataflow: (.*)\.(.*)\.(.*)$/);
                                    const objectType = objects[schema][objectName];

                                    return (
                                        <tr id={id} key={id} className="hover:bg-gray-100 hover:cursor-pointer" onClick={onRowClick}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="font-medium text-gray-900">{objectName}</div>
                                                <div className="text-gray-500">{id}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {databases[database]}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {schemas[database][schema]}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                <span className={`inline-flex rounded-full ${bgColors[objectType]} px-2 text-sm font-semibold leading-5 ${textColors[objectType]}`}>
                                                    {capitalizeFirstLetter(objectType)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {records}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {elapsed.substring(0, 5)}s
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}