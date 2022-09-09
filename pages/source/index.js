import React, { useState } from "react";

export function isNumeric(str) {
    if (typeof str !== "string") return false
    return !Number.isNaN(str) &&
      !Number.isNaN(parseFloat(str))
}

/**
 *
 * @param {{
 *  editable: boolean,
 *  className?: string,
 *  config: Object,
 *  configErrors?: Object,
 *  onConfigChange: () => void,
 * }} props
 * @returns
 */
function Source(props) {
    const { className, editable, config: initialConfig, onConfigChange } = props;
    const [config, setConfig] = useState(initialConfig);

    const {
        host,
        authorization
    } = config;

    const buildHandleChange = (field) => {
        return (e) => {
            const { target } = e;
            const { value } = target;

            const newConfig = {
                ...config
            };

            /**
             * Handle authorization fields.
             */
            if (field === "user" || field === "password") {
                if (!authorization) {
                    newConfig.authorization = {
                        [field]: value
                    };
                } else {
                    newConfig.authorization = authorization;
                    newConfig.authorization[field] = value;
                }
            } else {
                /**
                 * Handle normal fields.
                 */
                newConfig[field] = value;
            }

            if (editable) {
                setConfig(newConfig);
            }
        }
    }

    const onContinueClick = () => {
        if (onConfigChange && editable) {
            onConfigChange(config);
        }
    };

    return (
        <div className={className}>
            {/**
             * Materialize Host
             */}
            <div className="mt-2">
                <input
                    type="text"
                    placeholder="Host"
                    name="materialize_host"
                    id="host"
                    autoComplete="materialize_host"
                    className={`p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs border-gray-300 rounded-md`}
                    onChange={buildHandleChange("host")}
                    value={host}
                />
            </div>

            {/* Authorizations */}
            <p className="block text-sm font-medium text-white sm:mt-px sm:py-2">
                Authorization
            </p>
            {/**
             * Materialize User
             */}
            <div>
                <input
                    type="text"
                    placeholder="User"
                    name="materialize_user"
                    id="user"
                    autoComplete="materialize_user"
                    className={`p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs border-gray-300 rounded-md`}
                    onChange={buildHandleChange("user")}
                    value={authorization && authorization.user}
                    readOnly={editable === false}
                />
            </div>

            {/**
             * Materialize Passowrd
             */}
            <div className="mt-2">
                <input
                    type="password"
                    placeholder="Password"
                    name="materialize_password"
                    id="password"
                    autoComplete="materialize_password"
                    className={`p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-xs border-gray-300 rounded-md`}
                    onChange={buildHandleChange("password")}
                    value={authorization && authorization.password}
                />
            </div>


            <div className="mt-4">
                <button className="bg-purple-700 w-full rounded p-1 hover:bg-purple-500" onClick={onContinueClick}>
                    Continue
                </button>
            </div>
        </div >
    );
}

Source.defaultProps = {
    configErrors: {
        host: false,
        user: false,
        database: false,
        password: false,
        port: false,
    },
    config: {},
    className: "",
    onConfigChange: () => { },
}

export default Source;