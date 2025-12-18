module.exports = (allowedFields) => (req, res, next) => {
  const extras = Object.keys(req.body).filter(
    (k) => !allowedFields.includes(k)
  );
  if (extras.length > 0) {
    return res
      .status(400)
      .json({ error: `Campos extras não permitidos: ${extras.join(', ')}` });
  }
  next();
};
