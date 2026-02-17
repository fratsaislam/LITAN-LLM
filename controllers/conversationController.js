const Conversation = require("../models/Conversation");
const User = require("../models/userModel")
const ExperimentGroup = require("../models/ExperimentGroup");

exports.createConverstaion = async (req, res) => {
    const { anonymizedUserId } = req.body;
    try{
        const existingUser = await User.findOne({anonymizedUserId});
        if(!existingUser){
            return res.status(404).json({success:false, message: 'user does not exist'});
        }

    
        const group = await ExperimentGroup.findOne({users: existingUser._id})

        const result = await Conversation.create({
            anonymizedUserId,
            groupId : group._id,
            model: "gpt-4",
            messages: [
                {role: "system", content: group.promptTweaks}
            ],
        });

        return res.status(201).json({
            success: true,
            message: 'Your Account Has Been Created Successfully !',
            data: result
        });

    } catch(error){
        console.log(err);
    }
}