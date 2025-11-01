import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ debug: false });

/**
    * Checks authentication
    * @param {Request} req - request
    * @param {Response} res - response
    * @param {NextFunction} next - next performing action
    * @returns {void}
*/
const verify = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) return res.status(401).json({ message: 'Missing authentication token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: "https://fweb-project.onrender.com", audience: "https://teach-and-tackle.onrender.com" });
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

/**
    * Checks required keys
    * @param {string} source - source of data
    * @param {string[]} keys - keys to check
    * @returns {Function} - middleware function
*/
const checkRequiredKeys = (source, keys) => {
    return (req, res, next) => {
        const data = req[source];
        if (!data) return res.status(400).json({ message: "Data is empty" });
        if (typeof data !== 'object') return res.status(400).json({ message: `Data not an object. It is a ${typeof data}` });

        let missingKeys = keys.filter(key => !Object.prototype.hasOwnProperty.call(data, key));
        if (missingKeys.length > 0) return res.status(400).json({ message: "Missing required keys: " + missingKeys.join(", ") });

        next();
    }
}

export { verify, checkRequiredKeys };