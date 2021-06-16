import React, { Component } from "react";
import BigNumber from "bignumber.js/bignumber";
import { toast } from "react-toastify";
import Box from "./Boxes";
import Row from "./Rows";
import { InputField } from "./inputField";
import { Statistics } from "./Statistics";
import { roundValue, convertToETH } from "../../../../utilities/helpers";

export default class Pool extends Component {
  constructor(props) {
    super(props);
    this.token = null;
    this.state = {
      isSmall: null,
      isExpanded: null,
      toDeposit: 0.0,
      toWithdraw: 0.0,
      isApproved: false,
    };
  }

  componentDidMount() {
    window.addEventListener("resize", this.onResize.bind(this));
    this.onResize();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.token.price !== prevProps.token.price ||
      this.props.token.apy !== prevProps.token.apy ||
      this.props.token.tvl !== prevProps.token.tvl ||
      this.props.token.depositable !== prevProps.token.depositable ||
      this.props.token.deposited !== prevProps.token.deposited ||
      this.props.token.rewards !== prevProps.token.rewards ||
      this.props.token.approved !== prevProps.token.approved
    ) {
      this.setState({});
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize());
  }

  onResize = () => {
    this.setState({
      isSmall: window.innerWidth < 768,
    });
  };

  toggleExpand = () => {
    this.setState((prevState) => ({
      isExpanded: !prevState.isExpanded,
    }));
  };

  onConvert = (n) => {
    if (this.props.token.unit === "WBTC") {
      n = Math.floor(n * 10 ** 7) / 10 ** 5;
      return this.props.w3.utils.toWei(n.toString(), "mwei");
    } else if (this.props.token.unit === "USDC") {
      n = Math.floor(n * 10 ** 5) / 10 ** 5;
      return this.props.w3.utils.toWei(n.toString(), "mwei");
    } else {
      return this.props.w3.utils.toWei(n.toString());
    }
  };

  onMaxDeposit = () => {
    let n = this.props.token.depositable;

    if (this.props.token.unit === "USDC") {
      n = Math.floor(n / 100) / 10 ** 4;
      this.setState({ toDeposit: n });
    } else if (this.props.token.unit === "WBTC") {
      n = Math.floor(n / 100) / 10 ** 6;
      this.setState({ toDeposit: n });
    } else {
      n = Math.floor(n / 10 ** 12) / 10 ** 6;
      this.setState({ toDeposit: n });
    }
  };

  onMaxWithdraw = () => {
    let n = this.props.token.deposited;

    if (this.props.token.unit === "USDC") {
      n = Math.floor(n / 100) / 10 ** 4;
      this.setState({ toWithdraw: n });
    } else if (this.props.token.unit === "WBTC") {
      n = Math.floor(n / 100) / 10 ** 6;
      this.setState({ toWithdraw: n });
    } else {
      n = Math.floor(n / 10 ** 12) / 10 ** 6;
      this.setState({ toWithdraw: n });
    }
  };

  onApprove = () => {
    const { w3, token, farmContract } = this.props;
    let b = token.depositable * 2;
    let uB;
    if (this.props.token.unit === "USDC") {
      uB = this.onConvert(b / 10 ** 6);
    } else if (this.props.token.unit === "WBTC") {
      uB = this.onConvert(b / 10 ** 8);
    } else {
      uB = this.onConvert(b / 10 ** 18);
    }

    token.contract.methods
      .approve(farmContract._address, uB)
      .send({ from: this.props.walletconnect?.account })
      .then((res) => {
        if (res.status === true) {
          token.getApprovedAmount(
            w3,
            token.address,
            token.farmAddress,
            this.props.walletconnect?.account
          );
          toast.success("Successfully approved.");
          this.setState({ isApproved: true });
        }
      })
      .catch((err) => toast.error("Could not approve."));
  };

  onDepositExecute = () => {
    const { token, farmContract } = this.props;
    const tD = this.state.toDeposit;
    let d = this.onConvert(tD);

    farmContract.methods
      .deposit(token.pid, d)
      .send({ from: this.props.walletconnect?.account })
      .then((res) => {
        toast.success("Successfully deposited.");
        this.setState(() => ({
          toDeposit: 0.0,
        }));
      })
      .catch((err) => toast.error("Could not deposit."));
  };

  onWithdrawExcecute = () => {
    const { token, farmContract } = this.props;
    const tW = this.state.toWithdraw;
    let w = this.onConvert(tW);

    farmContract.methods
      .withdraw(token.pid, w)
      .send({ from: this.props.walletconnect?.account })
      .then((res) => {
        toast.success("Successfully withdrawn.");
        this.setState(() => ({
          toWithdraw: 0.0,
        }));
      })
      .catch((err) => toast.error("Could not withdraw."));
  };

  onClaim = () => {
    const { token, farmContract } = this.props;
    farmContract.methods
      .deposit(token.pid, 0)
      .send({ from: this.props.walletconnect?.account })
      .then((res) => {
        toast.success("Rewards claimed.");
        token.rewards = null;
        this.setState({});
      })
      .catch((err) => toast.error("Could not claim rewards."));
  };

  onDepositChange = (e) => {
    let depositable = BigNumber(
      convertToETH(this.props.token.depositable, this.props.token.unit)
    ).toNumber();

    let toDeposit =
      BigNumber(e.target.value).toNumber() > depositable
        ? depositable
        : BigNumber(e.target.value).toNumber();

    this.setState({ toDeposit: isNaN(toDeposit) ? "" : toDeposit });
  };

  onWithdrawChange = (e) => {
    let deposited = BigNumber(
      convertToETH(this.props.token.deposited, this.props.token.unit)
    ).toNumber();

    let toWithdraw =
      BigNumber(e.target.value).toNumber() > deposited
        ? deposited
        : BigNumber(e.target.value).toNumber();

    this.setState({ toWithdraw: isNaN(toWithdraw) ? "" : toWithdraw });
  };

  render() {
    const { token, walletconnect } = this.props;
    const { isExpanded, toDeposit, toWithdraw, isApproved } = this.state;

    let approved = 0;
    let decimals = 18;

    if (this.props.token.unit === "USDC") {
      approved = Math.floor(token.approved / 100) / 10 ** 4;
      decimals = 6;
    } else if (this.props.token.unit === "WBTC") {
      approved = Math.floor(token.approved / 100) / 10 ** 6;
      decimals = 8;
    } else {
      approved = Math.floor(token.approved / 10 ** 12) / 10 ** 6;
    }

    const currApproved = approved !== undefined ? approved : "-";

    return (
      <div
        className={`farm-${this.state.isSmall ? "box" : "row"}-container ${
          isExpanded ? "expanded" : ""
        }`}
      >
        {this.state.isSmall ? (
          <Box
            token={token}
            toggleExpand={this.toggleExpand}
            isExpanded={isExpanded}
            isConnected={walletconnect?.isConnected}
          />
        ) : (
          <Row
            token={token}
            toggleExpand={this.toggleExpand}
            isExpanded={isExpanded}
            isConnected={walletconnect?.isConnected}
          />
        )}
        {isExpanded && (
          <div className="expanded">
            <div className="statistics">
              <div className="title">Statistics:</div>
              <Statistics
                t={`${token.unit} Deposited`}
                v={`${convertToETH(token.deposited, this.props.token.unit)} ${
                  token.unit
                }`}
                isConnected={walletconnect?.isConnected}
              />
              <Statistics
                t={"Claimable Rewards"}
                v={`${roundValue(token.rewards)} GDAO`}
                isConnected={walletconnect?.isConnected}
              />
            </div>
            <div className="fields">
              <InputField
                title={"Your wallet"}
                current={convertToETH(token.depositable, this.props.token.unit)}
                unit={token.unit}
                onMax={this.onMaxDeposit}
                onAction={this.onDepositExecute}
                onAction1={this.onApprove}
                value={toDeposit}
                onChange={(e) => this.onDepositChange(e)}
                buttonTitle={"Deposit"}
                isConnected={walletconnect?.isConnected}
                isApproved={isApproved}
                isDeposit={true}
                subtitle={"Approved: " + currApproved + ", Deposit Fee: 2%"}
                valueApproved={token.approved}
                tokenDecimals={decimals}
              />
              <InputField
                title={"Staked in contract"}
                current={convertToETH(token.deposited, this.props.token.unit)}
                unit={token.unit}
                onMax={this.onMaxWithdraw}
                onAction={this.onWithdrawExcecute}
                value={toWithdraw}
                onChange={(e) => this.onWithdrawChange(e)}
                buttonTitle={"Withdraw"}
                isConnected={walletconnect?.isConnected}
                isDeposit={false}
                subtitle={"Withdraw and claim rewards"}
              />
            </div>
            {token.displayWarning && (<p class="warning-text">Mines will cease to generate rewards June 25th at approximately 3pm CST (based on block number)</p>)}
            <div className="claims">
              <div className="title">Available rewards:</div>
              <div className="value">{`${
                walletconnect?.isConnected ? roundValue(token.rewards) : "-"
              } GDAO`}</div>
              <button
                className="claim-btn"
                onClick={this.onClaim}
                disabled={!walletconnect?.isConnected}
              >
                Claim Rewards
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}
