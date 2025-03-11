export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Accès non autorisé: Droits administrateur requis" });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Erreur lors de la vérification des droits administrateur",
      });
  }
};
