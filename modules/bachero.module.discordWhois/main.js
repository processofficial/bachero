const bacheroFunctions = require('../../functions')
const fetch = require('node-fetch')
var CronJob = require('cron').CronJob
var botClient

// Tout les jours à 4h21 du matin
new CronJob('21 4 * * *', async function() {
	// Obtenir le client du bot
	if(!botClient) botClient = bacheroFunctions.botClient.get()

	// Préparer la liste des gens à vérifier sur Discord WhoIs
	var listToVerify = []
	var guildNumber = botClient.guilds.cache.size
	var verifiedGuild = 0

	// Obtenir le maximum de personne possible à travers tout les serveurs
	var getMembers = new Promise(async (resolve, reject) => {
		botClient.guilds.cache.forEach(guild => { // A chaque serveur rejoint par le bot
			guild.members.fetch().then(members => { // Obtenir tout les membres du serveur
				members.forEach(member => { // A chaque membre du serveur
					if(member.user.id && listToVerify.indexOf(member.user.id) == -1) listToVerify.push(member.user.id)
				})

				// Si on a vérifier le nombre de serveurs rejoint par le bot, c'est parfait
				verifiedGuild++
				if(verifiedGuild === guildNumber) resolve()
			})
		})
	})

	// Préparer une variable pour éviter les doublons
	var verified = []

	// Une fois tout les utilisateurs obtenu
	await getMembers
	listToVerify.forEach((userId, i) => {
		// Vérifier si l'utilisateur a pas déjà été vérifié
		if(verified.includes(userId)) return

		// Faire une requête vers Discord WhoIs
		setTimeout(async () => {
			verified.push(userId)
			await fetch(`https://discord-whois.vercel.app/api/getDiscord?discordId=${userId}`, { headers: { 'User-Agent': 'BacheroBot (+https://github.com/bacherobot/bot)' } }).catch(err => {})
		}, i * 2000)
	})
})

// Définir dans le cache le client du bot
var getBotInterval = setInterval(async () => {
	// Si on a pas de client, le récupérer et mettre dans le cache
	if(!botClient) botClient = bacheroFunctions.botClient.get()

	// Si le client n'est pas prêt, le supprimer du cache
	if(!botClient?.readyAt) botClient = null
	// Sinon
	else {
		// Supprimer l'interval
		clearInterval(getBotInterval)

		// Quand quelqu'un change d'information sur son compte (event via le client)
		botClient.on('userUpdate', async (oldUser, newUser) => {
			// Si on a l'ancien pseudo, et le nouveau, vérifier que ça soit pas les mêmes
			if(oldUser.username && newUser.username && oldUser.username == newUser.username) return

			// Ajouter dans l'historique WhoIs
			if(newUser.id || oldUser.id) await fetch(`https://discord-whois.vercel.app/api/getDiscord?discordId=${newUser.id || oldUser.id}`, { headers: { 'User-Agent': 'BacheroBot (+https://github.com/bacherobot/bot)' } }).catch(err => {})
		})
	}
}, 30000)