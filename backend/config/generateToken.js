import jwt from 'jsonwebtoken';

export const genetateToken = async(req,res) => {
    const accessToken = jwt.sign({id: req.user.id}, process.env.JWT_SECRET, {expiresIn: '1m'});

    const refereshToken = jwt.sign({id:req.body.id}, process.env.JWT_SECRET, {expiresIn: '1d'});

    const storeRefereshToken =  `refresh:${req.user.id}`;
    await redisClient.set(storeRefereshToken, refereshToken, 'EX', 24 * 60 * 60); // EX: 1 day

    res.cookies('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 1000 // 1 minute
    });

    res.cookies('refreshToken', refereshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return { accessToken, refereshToken };
}