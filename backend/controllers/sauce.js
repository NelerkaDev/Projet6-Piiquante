const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({ error }));
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
    .then(() => res.status(200).json({ message: 'Votre sauce à bien été créée ! '}))
    .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
    {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...JSON.parse(req.body.sauce) };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Votre sauce à bien été modifiée !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
        if(!sauce) {
            return res.status(404).json({ error : new Error('La sauce n\'a pas été trouvée !')});
        }
        if(sauce.userId !== req.auth.userId) {
            return res.status(401).json({ error: new Error('Requête non autorisée !')});
        }
        if(sauce.imageUrl && sauce.imageUrl !== "") {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Votre sauce à bien été supprimée !' }))
                .catch(error => res.status(400).json({ error }));
            });
        } else {
            Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Votre sauce à bien été supprimée !' }))
            .catch(error => res.status(400).json({ error }));
        }
    })
    .catch(error => {
        res.status(500).json({ error })
    });    
};

exports.likedSauce = (req, res, next) => {
    const userId = req.body.userId;
    const like = req.body.like;
    Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
        switch(like) {
            case 1:
                if(!sauce.usersLiked.includes(userId)){
                    sauce.usersLiked.push(userId);
                    sauce.likes++;
                }
                break;
            case 0:
                if(!sauce.usersLiked.includes(userId)){
                    sauce.usersLiked = sauce.usersLiked.filter((id) => id !== userId);
                    sauce.likes--;
                }
                if(!sauce.usersDisliked.includes(userId)){
                    sauce.usersDisliked = sauce.usersDisliked.filter((id) => id !== userId);
                    sauce.dislikes--;
                }
                break;
            case -1:
                if(!sauce.usersDisliked.includes(userId)){
                    sauce.usersDisliked.push(userId);
                    sauce.dislikes++;
                }
                break;
        }
        sauce.save()
        .then(() => res.status(200).json(sauce))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(400).json({ error }));
    
};