const { ethers, Wallet } = require("ethers");

export class ETHMixer {
 private currentWallets: any[] = [];
 private nextWallets: any[] = [];

  private provider;
  private signer;
  private initialWallet;

  private options: any = {};
  private levelTransacs = 0;

  private GAS_LIMIT = 100000;
  private explorer;

  constructor({
    rpc,
    explorer
  }: any) {
    this.provider = new ethers.providers.JsonRpcProvider(
      rpc
    );
    this.explorer = explorer
  
    this.signer = this.provider.getSigner();
    this.initialWallet = Wallet.createRandom();
    //this.initialWallet =  initialWallet.connect(this.provider);

    this.nextWallets = [this.initialWallet.privateKey];
  }
  updateOptions(options: Object){
    this.options = {
      ...this.options,
      ...options,
    };
  }
  getOption(key: string) {
    return this.options[key] ?? null
  }
  
  mixateETH(){
    this.expend()
  }

  async expend(index = 0) {
    
    this.levelTransacs = 0;
    this.currentWallets = this.nextWallets;
    this.nextWallets = [];

    console.info('---------------------------------------------------------------------')
    console.info(`Expend level: ${index+1}`)
    console.info(`Wallets in this level: ${this.currentWallets.length}`)

    this.currentWallets.forEach(async wallet => {
    
      const connectedWallet = await new Wallet(wallet).connect(this.provider)

      const gasPrice = await this.provider.getGasPrice();  
      const balance = await connectedWallet.getBalance() 
    
      const left = Wallet.createRandom()//.connect(this.provider)
      const right = Wallet.createRandom()//.connect(this.provider);
      
      this.nextWallets.push(left.privateKey)
    
      this.nextWallets.push(right.privateKey)  
  
      console.info('------------------------')
      console.info(`From: ${connectedWallet.address} - privateKey: ${connectedWallet.privateKey}`)
      console.info(`To-left : ${left.address} - privateKey: ${left.privateKey}`)
      console.info(`To-right : ${right.address} - privateKey: ${right.privateKey}`)
      console.info('------------------------')

      
      
      const tx = {
        from: connectedWallet.address,
        to: left.address,
        value: balance.div(2),
        gasLimit: ethers.utils.hexlify(this.GAS_LIMIT),
        gasPrice: gasPrice,
      }
      const estimatedGas = await connectedWallet.estimateGas(tx)
      const gasValue = estimatedGas * gasPrice;
      tx.value = tx.value.sub(gasValue)
      //console.log('TX: ',tx)
      
      connectedWallet.sendTransaction(tx).then((transaction: any) => transaction.wait('receip'))
      .then(async (transaction: any) => {

          this.levelTransacs++;
          this.printTransactionLink(transaction.transactionHash)
          const balance = await connectedWallet.getBalance();
        
          const gasPrice = await this.provider.getGasPrice()
          const gasEstimation = await connectedWallet.estimateGas(tx);

          tx.gasPrice = gasPrice;
          tx.to = right.address;
          tx.value = balance.sub(this.GAS_LIMIT * gasPrice)

          connectedWallet.sendTransaction(tx).then((transaction: any) => transaction.wait('receip')).then((transaction: any) => {
          
            this.printTransactionLink(transaction.transactionHash)
            this.levelTransacs++;
            if(this.levelTransacs === this.currentWallets.length * 2){
              console.info('------------------------')
              console.log(`Level ${index} terminated`);
              
              if(index < this.options.occurencies - 1 )
                this.expend(index+ 1)
              else
                this.inflate(index + 1 );
            }
          })

        }).catch((err: any) => console.error(err))
      
    });
  }

  printTransactionLink(hash: string){
    console.info(`Tx: ${this.explorer}/tx/${hash}`);
  }
  async inflate(index: number) {
    

    this.levelTransacs = 0;
    this.currentWallets = this.nextWallets;
    this.nextWallets = [];

    console.info('---------------------------------')
    console.info(`INFLATE level: ${index}`)
    console.info(`Wallets in this level: ${this.currentWallets.length}`)

    let i = 0;
    if(this.currentWallets.length === 2){
      this.currentWallets.forEach(async (wallet) => {
        const connectedWallet = await new Wallet(wallet).connect(this.provider);
        const balance = await connectedWallet.getBalance();
        const gasPrice = await this.provider.getGasPrice();
        
        const tx = {
        from: connectedWallet.address,
        to: this.options.destination,
        value: balance.sub(this.GAS_LIMIT * gasPrice),
        gasLimit: ethers.utils.hexlify(this.GAS_LIMIT),
        gasPrice: gasPrice,
      }
  
      connectedWallet.sendTransaction(tx).then((transaction: any) => transaction.wait('receip')).then(async (transaction: any) => {
        console.info('------------------------')
        console.info(`From: ${connectedWallet.address} - privateKey: ${connectedWallet.privateKey}`)
        console.info(`To : ${this.options.destination}`)
        console.info('------------------------')
        this.printTransactionLink(transaction.transactionHash)
      }).catch((err: any) => console.error(err))
      })
      return;
    }

    while(i < this.currentWallets.length){
      const left = await new Wallet(this.currentWallets[i]).connect(this.provider);
      const right = await new Wallet(this.currentWallets[i+1]).connect(this.provider);

      const gasPrice = await this.provider.getGasPrice();

      const leftBalance = await left.getBalance()
      
      const rightBalance = await right.getBalance();
      

      //console.log("🚀 ~ file: ETHMixer.ts ~ line 171 ~ ETHMixer ~ inflate ~ leftBalance", ethers.utils.formatUnits(leftBalance))
      //console.log("🚀 ~ file: ETHMixer.ts ~ line 173 ~ ETHMixer ~ inflate ~ rightBalance", ethers.utils.formatUnits(rightBalance))
      
      const inflatedWallet = Wallet.createRandom()//.connect(this.provider)
      this.nextWallets.push(inflatedWallet.privateKey);
      i += 2;

       console.info('------------------------')
      console.info(`From-left: ${left.address} - privateKey: ${left.privateKey}`)
      console.info(`From-right: ${right.address} - privateKey: ${right.privateKey}`)
      console.info(`To : ${inflatedWallet.address} - privateKey: ${inflatedWallet.privateKey}`)
      console.info('------------------------')
  

      const txLeft = {
        from: left.address,
        to: inflatedWallet.address,
        value: leftBalance.sub(this.GAS_LIMIT * gasPrice),
        gasLimit: ethers.utils.hexlify(this.GAS_LIMIT), 
        gasPrice: gasPrice,
      }
      const txRight = {
        from: right.address,
        to: inflatedWallet.address,
        value: rightBalance.sub(this.GAS_LIMIT * gasPrice),
        gasLimit: ethers.utils.hexlify(this.GAS_LIMIT), 
        gasPrice: gasPrice,
      }

      
      left.sendTransaction(txLeft).then((transaction: any) => transaction.wait('receip')).then(async (transaction: any) => {
        this.levelTransacs++;
        this.printTransactionLink(transaction.transactionHash)
        if(this.levelTransacs === this.currentWallets.length){
          this.inflate(index -1);
        }
      }).catch((err: any) => console.error(err))
      right.sendTransaction(txRight).then((transaction: any) => transaction.wait('receip')).then(async (transaction: any) => {
        this.levelTransacs++;
        this.printTransactionLink(transaction.transactionHash)
        if(this.levelTransacs === this.currentWallets.length){
          this.inflate(index -1)
        }
      }).catch((err: any) => console.error(err))

      
    }
    
  }

  async waitForStart() {
    const INITIAL_WALLET_ADDRESS = await this.initialWallet.getAddress();
    console.info("Initial wallet private-key : " + this.initialWallet.privateKey);
    console.info(
      "Send BNB what you need to mix in this address : " + INITIAL_WALLET_ADDRESS
    );

    let intervalID: any;
    let inProgress = false;
    const connectedWallet = new Wallet(this.initialWallet).connect(this.provider)
    intervalID = setInterval(async () => {
      const balance = ethers.utils.formatUnits(await connectedWallet.getBalance());
      //--------------------------------
      if (balance > 0) {
        clearInterval(intervalID);
        if (!inProgress) this.mixateETH();
        inProgress = true;
      }
      
    }, 500);
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
}
