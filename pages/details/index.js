import { useEffect, useMemo, useState } from 'react';
import { Graph } from 'graphlib';

export default function Details(props) {
    const { config, dataflow } = props;
    const [Canvas, setCanvas] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const graph = useMemo(() => new Graph(), []);

    /**
     * Server side load
     */
    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
            const reaflow = require('reaflow');
            setCanvas(reaflow.Canvas);
        }
    }, []);

    useEffect(() => {
        if (config && dataflow) {
            fetch(`/api/dataflow`, {
                body: JSON.stringify({ config, dataflow }),
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
                        setData(data);
                    }
                }).catch(console.error);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [config, dataflow]);

    /**
     * Load parts
     */
     const { edges, nodes } = useMemo(() => {
        if (data) {
            const { addresses, channels, operators } = data;

            /**
             * Node operators
             */
            operators.rows.forEach(({ id, name }) => {
                graph.setNode(id, name);
            });

            /**
             * Node channels between addresses
             */
            const addrs = {};
            const rev_addreses = {};

            addresses.rows.forEach(({ id, address: rawAddress }) => {
                const address = rawAddress.substring(1, rawAddress.length - 1).split(",");

                if (!addrs[id]) {
                    addrs[id] = address;
                    rev_addreses[address[address.length - 1]] = id;
                }
            });


            channels.rows.map(({ id: chanId, source_node, target_node, sent }) => {
                const from = rev_addreses[source_node];
                const to = rev_addreses[target_node];
                const id = `${from}-${to}-${chanId}`;
                graph.setEdge(from, to, id);
            });

            /**
             * Do the clean up
             */
            //  graph.nodes().forEach((id) => {
            //     const node = graph.node(id);
            //     if (node === "OkErr" || node === "OkErrDemux" || node === "Concatenate") {
            //         const parent = graph.predecessors(id).pop();
            //         const children = graph.neighbors(id).filter(nId => nId !== parent);

            //         if (node === "OkErr" || node === "OkErrDemux") {
            //             children.forEach((childrenId) => {
            //                 graph.removeEdge(id, childrenId);
            //                 if (graph.node(childrenId) !== "Concatenate") {
            //                     graph.setEdge(parent, childrenId);
            //                 } else {
            //                     graph.removeNode(childrenId);
            //                 }
            //             });
            //         } else if (node === "Concatenate") {
            //             children.forEach((childrenId) => {
            //                 graph.removeEdge(id, childrenId);
            //                 graph.removeNode(childrenId);
            //             });
            //         }

            //         graph.removeEdge(parent, id);
            //         graph.removeNode(id);
            //     }
            // });

            // while (graph.sinks().length > 1) {
            //     graph.sinks().forEach((sink) => {
            //         if (!graph.node(sink).startsWith("persist_sink")) {
            //             graph.removeNode(sink);
            //         }
            //     });
            // };

            return {
                edges: graph.edges().map(({v, w}) => ({id: `${v}-${w}`, from: v, to: w})),
                nodes: graph.nodes().map((id) => ({id, text: graph.node(id)}))
              }
        }

        return {
            edges: [],
            nodes: []
        }
    }, [data, graph]);

    return (
        typeof window !== 'undefined' && !loading && Canvas && (
            <Canvas
                nodes={nodes}
                edges={edges}
            />
        )
    )
}
